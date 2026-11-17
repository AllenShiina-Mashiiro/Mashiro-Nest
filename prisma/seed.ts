import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { countWords, colorFor, estimateReadingTime, slugifyTag } from "../src/lib/text";
import { demoAboutPage, demoAnime, demoFriends, demoMoments } from "../src/lib/data/seed-data";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();
const CONTENT_DIR = path.join(process.cwd(), "src", "content", "posts");

type Frontmatter = {
  title?: string;
  description?: string;
  date?: string;
  category?: string;
  tags?: string[];
  cover?: string;
  featured?: boolean;
  pinned?: boolean;
  draft?: boolean;
};

function readPosts() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Frontmatter;
      return {
        slug: file.replace(/\.mdx?$/, ""),
        title: fm.title ?? file,
        description: fm.description ?? "",
        content: content.trim(),
        cover: fm.cover ?? null,
        category: fm.category ?? null,
        tags: fm.tags ?? [],
        date: fm.date ? new Date(fm.date) : new Date(),
        featured: Boolean(fm.featured),
        pinned: Boolean(fm.pinned),
        draft: Boolean(fm.draft),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function main() {
  const email = (process.env.ADMIN_EMAIL?.trim() || "admin@mashiro.dev").toLowerCase();
  const author = await prisma.user.findUnique({ where: { email } });
  if (!author || author.role !== "ADMIN") {
    throw new Error("ADMIN_NOT_INITIALIZED: create the administrator first with npm run db:admin");
  }

  console.log(`→ using administrator: ${email}`);

  const posts = readPosts();
  console.log(`→ seeding ${posts.length} posts`);

  for (const post of posts) {
    let categoryId: string | null = null;
    if (post.category) {
      const category = await prisma.category.upsert({
        where: { slug: slugifyTag(post.category) },
        update: { name: post.category },
        create: {
          slug: slugifyTag(post.category),
          name: post.category,
          color: colorFor(post.category),
        },
      });
      categoryId = category.id;
    }

    const wordCount = countWords(post.content);
    const existing = await prisma.post.findUnique({
      where: { slug: post.slug },
      select: { publishedAt: true },
    });

    const data = {
      title: post.title,
      description: post.description,
      content: post.content,
      coverUrl: post.cover,
      published: !post.draft,
      featured: post.featured,
      pinned: post.pinned,
      publishedAt: post.draft ? null : (existing?.publishedAt ?? post.date),
      wordCount,
      readingTime: estimateReadingTime(wordCount),
      categoryId,
      authorId: author.id,
    };

    const created = await prisma.post.upsert({
      where: { slug: post.slug },
      update: data,
      create: { ...data, slug: post.slug },
    });

    await prisma.postTag.deleteMany({ where: { postId: created.id } });
    for (const name of post.tags) {
      const slug = slugifyTag(name);
      if (!slug) continue;
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { slug, name, color: colorFor(name) },
      });
      await prisma.postTag.create({ data: { postId: created.id, tagId: tag.id } });
    }
  }

  console.log("→ seeding moments");
  for (const moment of demoMoments) {
    const exists = await prisma.moment.findFirst({ where: { content: moment.content } });
    if (exists) continue;
    await prisma.moment.create({
      data: {
        content: moment.content,
        images: moment.images,
        location: moment.location,
        createdAt: new Date(moment.createdAt),
        authorId: author.id,
      },
    });
  }

  console.log("→ seeding friends");
  for (const [index, friend] of demoFriends.entries()) {
    const exists = await prisma.friend.findFirst({ where: { name: friend.name } });
    if (exists) continue;
    await prisma.friend.create({
      data: {
        name: friend.name,
        url: friend.url,
        avatarUrl: friend.avatar,
        description: friend.description,
        color: friend.color,
        order: index,
      },
    });
  }

  console.log("→ seeding anime");
  for (const [index, item] of demoAnime.entries()) {
    const exists = await prisma.anime.findFirst({ where: { title: item.title } });
    if (exists) continue;
    await prisma.anime.create({
      data: {
        title: item.title,
        coverUrl: item.cover,
        status: item.status,
        rating: item.rating,
        comment: item.comment,
        season: item.season,
        year: item.year,
        order: index,
      },
    });
  }

  console.log("→ seeding site settings");
  // 已存在则不覆盖，避免把后台改过的配置冲掉
  await prisma.setting.upsert({
    where: { key: "site" },
    update: {},
    create: { key: "site", value: JSON.stringify(DEFAULT_SETTINGS) },
  });

  console.log("→ seeding about page");
  await prisma.page.upsert({
    where: { slug: "about" },
    update: { content: demoAboutPage },
    create: { slug: "about", title: "关于", content: demoAboutPage },
  });

  console.log("\n✓ seed finished");
  console.log(`  admin email: ${email} (username: ${username})`);
  console.log("  admin password: read from ADMIN_PASSWORD environment variable");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
