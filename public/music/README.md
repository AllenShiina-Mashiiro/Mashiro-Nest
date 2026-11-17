# 音乐资源

`tracks/` 放音频文件（mp3 / m4a / wav / ogg 均可，浏览器支持什么就用什么），
`covers/` 放封面图（jpg / png / webp / svg）。

加好文件后，在 `src/config/music.ts` 的 `tracks` 里登记一条：

```ts
{
  id: "my-song-01",
  title: "歌曲名",
  artist: "歌手",
  cover: "/music/covers/my-cover.jpg",
  url: "/music/tracks/my-song.mp3",
}
```

`id` 必须唯一（会作为 React key）。

`demo-chime.wav` 和 `covers/demo.svg` 只是让播放器开箱可见的示例资源，
替换成自己的音乐后可以整个删掉。

> 注意：请确认音频的使用授权；大文件会占用服务器存储和带宽，
> Docker 部署时 `public/` 是打进镜像的，换歌需要重新构建镜像。
