const express = require("express");
const fs = require("fs");
const opn = require("opn");
const bodyParser = require("body-parser");
const path = require("path");
const chokidar = require("chokidar");
const cfg = require("./config");

const {
  loadXML,
  loadTempData,
  writeXML,
  saveDataFile,
  shuffle,
  saveErrorDataFile
} = require("./help");

let app = express(),
  router = express.Router(),
  cwd = process.cwd(),
  dataBath = __dirname,
  port = 8090,
  curData = {},
  luckyData = {},
  errorData = [],
  defaultType = cfg.prizes[0]["type"],
  defaultPage = `default data`;

//这里指定参数使用 json 格式
app.use(
  bodyParser.json({
    limit: "1mb"
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

if (process.argv.length > 2) {
  port = process.argv[2];
}

let staticDir = cwd; // 默认使用 cwd，可以通过 setStaticDir 更改

function setStaticDir(dir) {
  staticDir = dir;
}

// 使用中间件函数，这样可以动态获取 staticDir
app.use((req, res, next) => {
  express.static(staticDir)(req, res, next);
});

//请求地址为空，默认重定向到index.html文件
app.get("/", (req, res) => {
  res.redirect(301, "index.html");
});

//设置跨域访问
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

app.post("*", (req, res, next) => {
  log(`请求内容：${JSON.stringify(req.path, 2)}`);
  next();
});

// 获取之前设置的数据
router.post("/getTempData", (req, res, next) => {
  getLeftUsers();
  res.json({
    cfgData: cfg,
    leftUsers: curData.leftUsers,
    luckyData: luckyData
  });
});

// 获取所有用户
router.post("/reset", (req, res, next) => {
  luckyData = {};
  errorData = [];
  log(`重置数据成功`);
  saveErrorDataFile(errorData);
  return saveDataFile(luckyData).then(data => {
    res.json({
      type: "success"
    });
  });
});

// 获取所有用户
router.post("/getUsers", (req, res, next) => {
  res.json(curData.users);
  log(`成功返回抽奖用户数据`);
});

// 获取奖品信息
router.post("/getPrizes", (req, res, next) => {
  // res.json(curData.prize);
  log(`成功返回奖品数据`);
});

// 保存抽奖数据
router.post("/saveData", (req, res, next) => {
  let data = req.body;
  setLucky(data.type, data.data)
    .then(t => {
      res.json({
        type: "设置成功！"
      });
      log(`保存奖品数据成功`);
    })
    .catch(data => {
      res.json({
        type: "设置失败！"
      });
      log(`保存奖品数据失败`);
    });
});

// 保存抽奖数据
router.post("/errorData", (req, res, next) => {
  let data = req.body;
  setErrorData(data.data)
    .then(t => {
      res.json({
        type: "设置成功！"
      });
      log(`保存没来人员数据成功`);
    })
    .catch(data => {
      res.json({
        type: "设置失败！"
      });
      log(`保存没来人员数据失败`);
    });
});

// 保存数据到excel中去
router.post("/export", (req, res, next) => {
  let type = [1, 2, 3, 4, 5, defaultType],
    outData = [["工号", "姓名", "部门"]];
  cfg.prizes.forEach(item => {
    outData.push([item.text]);
    outData = outData.concat(luckyData[item.type] || []);
  });

  writeXML(outData, "/抽奖结果.xlsx")
    .then(dt => {
      // res.download('/抽奖结果.xlsx');
      res.status(200).json({
        type: "success",
        url: "抽奖结果.xlsx"
      });
      log(`导出数据成功！`);
    })
    .catch(err => {
      res.json({
        type: "error",
        error: err.error
      });
      log(`导出数据失败！`);
    });
});

//对于匹配不到的路径或者请求，返回默认页面
//区分不同的请求返回不同的页面内容
router.all("*", (req, res) => {
  if (req.method.toLowerCase() === "get") {
    if (/\.(html|htm)/.test(req.originalUrl)) {
      res.set("Content-Type", "text/html");
      res.send(defaultPage);
    } else {
      res.status(404).end();
    }
  } else if (req.method.toLowerCase() === "post") {
    let postBackData = {
      error: "empty"
    };
    res.send(JSON.stringify(postBackData));
  }
});

function log(text) {
  global.console.log(text);
  global.console.log("-----------------------------------------------");
}

function setLucky(type, data) {
  if (luckyData[type]) {
    luckyData[type] = luckyData[type].concat(data);
  } else {
    luckyData[type] = Array.isArray(data) ? data : [data];
  }

  return saveDataFile(luckyData);
}

function setErrorData(data) {
  errorData = errorData.concat(data);

  return saveErrorDataFile(errorData);
}

app.use(router);

function loadData() {
  console.log("加载EXCEL数据文件");
  let cfgData = {};

  // curData.users = loadXML(path.join(cwd, "data/users.xlsx"));
  // curData.users = loadXML(path.join(dataBath, "data/users.xlsx"));

  // Load from user.txt
  const userTxtPath = path.join(dataBath, "data/user.txt");
  if (fs.existsSync(userTxtPath)) {
    console.log("Loading users from user.txt");
    const content = fs.readFileSync(userTxtPath, 'utf-8');
    // Assume format: EnglishName\tChineseName or similar
    // Assume format: Space/Tab separated names, multiple per line allowed
    const tokens = content.split(/[\s\n\r]+/);
    curData.users = tokens
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(name => [name, name]); // Use name as both ID and Name
  } else {
    console.log("user.txt not found, fallback to xlsx");
    curData.users = loadXML(path.join(dataBath, "data/users.xlsx"));
  }

  // 重新洗牌
  shuffle(curData.users);
  console.log(`Loaded ${curData.users.length} users.`);


  // 读取已经抽取的结果
  loadTempData()
    .then(data => {
      luckyData = data[0];
      errorData = data[1];
    })
    .catch(data => {
      curData.leftUsers = Object.assign([], curData.users);
    });
}

function getLeftUsers() {
  //  记录当前已抽取的用户
  let lotteredUser = {};
  for (let key in luckyData) {
    let luckys = luckyData[key];
    luckys.forEach(item => {
      lotteredUser[item[0]] = true;
    });
  }
  // 记录当前已抽取但是不在线人员
  errorData.forEach(item => {
    lotteredUser[item[0]] = true;
  });

  let leftUsers = Object.assign([], curData.users);
  leftUsers = leftUsers.filter(user => {
    return !lotteredUser[user[0]];
  });
  curData.leftUsers = leftUsers;
}

loadData();

module.exports = {
  run: function (devPort, noOpen, staticDirPath) {
    let openBrowser = true;
    if (process.argv.length > 3) {
      if (process.argv[3] && (process.argv[3] + "").toLowerCase() === "n") {
        openBrowser = false;
      }
    }

    if (noOpen) {
      openBrowser = noOpen !== "n";
    }

    if (devPort) {
      port = devPort;
    }

    // 如果提供了静态文件目录，则设置它
    if (staticDirPath) {
      setStaticDir(staticDirPath);
      console.log(`Using static directory: ${staticDirPath}`);
    } else {
      console.log(`Using default static directory: ${staticDir}`);
    }

    let server = app.listen(port, () => {
      let host = server.address().address;
      let port = server.address().port;
      global.console.log(`lottery server listenig at http://${host}:${port}`);
      openBrowser && opn(`http://127.0.0.1:${port}`);
    });
  }
};
