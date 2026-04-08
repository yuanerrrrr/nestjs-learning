# Day 1 - Node.js 基础 & Nest.js 初体验

## 今日完成
- [x] CommonJS 模块系统（require/module.exports）
- [x] npm 基础（init, install, scripts）
- [x] 原生 Node HTTP 服务（返回 JSON）
- [x] 全局安装 Nest CLI，创建项目 my-first-nest-app
- [x] 理解项目结构（main, module, controller, service）
- [x] 修改控制器返回值，体验热重载

## 关键代码片段

### 原生 HTTP 服务
```js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello Node' }));
});
server.listen(3000);