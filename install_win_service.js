const Service = require('node-windows').Service;
const Path = require('path');
const svc = new Service(
  {
    name:"SSR Auto Reflash",
    description : "SSR Service List Auto Reflash At 0,6,12,18",
    script:Path.join(__dirname,'index.js')
  }
)

svc.on('install',()=>{
  svc.start();
});


svc.install();