# Javascript-SignalR
Real-time applications using ASP.NET Core.Javascript client for ASP.NET SignalR.

# AspNet Core SignalR Javascript客户端
为了兼容低版本浏览器，依葫芦画瓢写了寂寞

# Get Started
使用方法与官方ASP.NET Core SignalR JavaScript基本一致

## 依赖
<script src="https://cdn.bootcdn.net/ajax/libs/promise-polyfill/8.2.0/polyfill.js"></script>

## 创建对象
var connection = new signalR.HubConnectionBuilder()
    .withUrl("/chathub")
    .configureLogging(signalR.LogLevel.Information)
    .build();
    
## 开启连接
connection.start().then(function(){
   console.log("连接成功");
},function(){
   console.log("连接失败");
});

## 调用服务端方法
connection.send(methodName,agrs...);

## 注册客户端方法供服务端调用
connection.on("clientMethod",(res)=>{
    console.log("被服务端调用");
});
