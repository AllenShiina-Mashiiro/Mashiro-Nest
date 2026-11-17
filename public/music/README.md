# 音乐资源

`tracks/` 放音频文件（mp3 / m4a / wav / ogg 均可，浏览器支持什么就用什么），
`covers/` 放封面图（jpg / png / webp / svg）。

加好文件后，到后台 `/admin/settings` →「音乐播放器」→「本地曲目」里登记，一行一首：

```text
歌曲名 | 歌手 | /music/covers/my-cover.jpg | /music/tracks/my-song.mp3
```

`历史顺序就是播放顺序`；保存后前台立即生效，不需要重新构建（前提是音频文件已经在 `public/` 里）。

`demo-chime.wav` 和 `covers/demo.svg` 只是让播放器开箱可见的示例资源，
替换成自己的音乐后可以整个删掉。

> 注意：请确认音频的使用授权；大文件会占用服务器存储和带宽，
> Docker 部署时 `public/` 是打进镜像的，换歌需要重新构建镜像。
