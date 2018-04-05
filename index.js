const EventProxy = require('eventproxy');
const later = require('later');

const superagent = require('superagent');
const cheerio = require('cheerio');
const guid = require('guid');
const fs = require('fs');
const guiconfig = require('./gui-config');
const mixin = require('mixin-object');
const dicObject = {
  ip: "IP Address:",
  port: "Port:",
  password: "Password:",
  method: "Method:",
  protocol: "auth_sha1_v4",
  obfs: "tls1.2_ticket_auth"
}
let serverList = [];
let CONFIG_TEMPLATE =
  {
    remarks: '',
    id: '',
    server: '',
    server_port: 0,
    server_udp_port: 0,
    password: '',
    method: 'aes-256-cfb',
    protocol: 'origin',
    protocolparam: '',
    obfs: 'plain',
    obfsparam: '',
    remarks_base64: '',
    group: 'ishadow',
    enable: true,
    udp_over_tcp: false
  };

const sched = later.parse.recur().on(4,10,16,22).hour().on(5).minute();

const reflash = function () {
  console.time('reflash');
  superagent.get("https://get.ishadowx.net/").end((err,data) => {
    if (err) {
      console.error(err);
      return;
    }
    let $ = cheerio.load(data.res.text);
    let targetDiv = $('.portfolio-item');
    let configs = [];
    serverList = [];
    if (targetDiv.length > 0) {
      targetDiv.each((i, e) => {
        let tempStr = $(e).find('.hover-text').text().split('\n');
        let serverObj = {};
        tempStr.length > 0 && tempStr.forEach(ts => {
          ts = ts.trim();
          Object.keys(dicObject).forEach(key => {
            if (ts.indexOf(dicObject[key]) > -1) {
              if (key === 'protocol' || key === 'obfs') {
                serverObj[key] = dicObject[key];
              } else {
                serverObj[key] = ts.replace(dicObject[key], '');
              }
            }
          });
        });
        if (Object.keys(serverObj).length > 0 && serverObj.port && serverObj.password) {
          serverList.push(serverObj);
        }
      });
      // console.info(serverList);
      if (serverList.length > 0) {
        let epConfigs = new EventProxy();
        epConfigs.after('config', serverList.length, configs => {
          guiconfig.configs = configs;
          fs.writeFileSync("./gui-config.json", JSON.stringify(guiconfig, null, 2));
          console.timeEnd('reflash');
        });
        serverList.forEach(obj => {
          let configObj = {
            id: guid.raw().replace(/\-/g, '').toLocaleUpperCase(),
            server: obj.ip,
            server_port: obj.port,
            password: obj.password,
            method: obj.method
          };
          if (obj.protocol && obj.obfs) {
            configObj.protocol = obj.protocol;
            configObj.obfs = obj.obfs;
          }
          configObj = mixin({}, CONFIG_TEMPLATE, configObj);
          epConfigs.emit('config', configObj);
        });
      }
      // console.info(configs);
      // console.info(guiconfig);

      // fs.writeFileSync('./gui-config.json', JSON.stringify(guiconfig, null, 2));
    }
  });
};

later.setInterval(reflash, sched);
reflash();