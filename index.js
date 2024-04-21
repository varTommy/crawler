const puppeteer = require("puppeteer");
const { input } = require("@inquirer/prompts");
const fs = require("fs");
const https = require("https");
const xlsx = require("node-xlsx");

let infourl = ""; // 文件地址
let url = "";
let page = null;
let btn_position = null;
let times = 0; // 执行重新滑动的次数
const distanceError = [-10, 2, 3, 5]; // 距离误差
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const getQuotes = async () => {
  const browser = await puppeteer.launch({
    headless: true, //使无头浏览器可见，便于开发过程中观察
    args: ["--disable-infobars"],
  });

  const page = await browser.newPage(); //打开新的空白页
  await page.goto(url, { waitUntil: "networkidle0", timeout: 5000 }); //访问页面
  await page.evaluate(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  console.log("准备跳过验证");
  // 获取滑块大小
  distance = await page.evaluate(() => {
    function compare(document) {
      if (document.querySelector("#nc_1__scale_text")) {
        const { clientWidth } = document.querySelector("#nc_1__scale_text");
        return clientWidth;
      } else {
        return 0;
      }
    }
    return compare(document);
  });
  // 如果获取到了 模拟滑动
  if (distance) {
    btn_position = await page.evaluate(() => {
      const { top, left } = document
        .querySelector("#nc_1_n1z")
        .getBoundingClientRect();
      return { btn_left: left, btn_top: top };
    });
    page.mouse.move(btn_position.btn_left + 10, btn_position.btn_top + 5);
    page.mouse.down();
    page.mouse.move(
      btn_position.btn_left + distance / 3,
      btn_position.btn_top,
      {
        steps: 30,
      }
    );
    page.mouse.move(
      btn_position.btn_left + (distance / 3) * 2,
      btn_position.btn_top,
      {
        steps: 35,
      }
    );
    page.mouse.move(btn_position.btn_left + distance, btn_position.btn_top, {
      steps: 45,
    });
    await sleep(1000);
    page.mouse.up();
  }

  // check = await page.evaluate(() => {
  //   let Width = 0;
  //   if (document.querySelector("#nc_1__scale_text")) {
  //     const { clientWidth } = document.querySelector("#nc_1__scale_text");
  //     Width = clientWidth;
  //   }
  //   return Width;
  // });
  // if (check != 0) {
  //   console.log("跳过验证失败");
  // } else {
  //   console.log("跳过验证,等待页面加载");
  // }
  console.log("跳过验证,等待页面加载");
  // 等页面加载
  await sleep(5000);
  page.evaluate((_) => {
    window.scrollBy(0, window.innerHeight);
  });
  await sleep(1000);

  console.log("展开sku");
  // 展开sku  获取位置并点击
  extendButton = await page.evaluate(() => {
    function compare(document) {
      if (document.querySelector(".sku-wrapper-expend-button")) {
        const { clientWidth } = document.querySelector(
          ".sku-wrapper-expend-button"
        );
        return clientWidth;
      } else {
        return 0;
      }
    }
    return compare(document);
  });
  if (extendButton) {
    postion = await page.evaluate(() => {
      const { top, left } = document
        .querySelector(".sku-wrapper-expend-button")
        .getBoundingClientRect();
      return { btn_left: left, btn_top: top };
    });
    page.mouse.click(postion.btn_left + 5, postion.btn_top + 3);
  }

  console.log("展开商品属性");
  // 商品属性部分的展开
  attrSwitch = await page.evaluate(() => {
    function compare(document) {
      if (document.querySelector(".offer-attr-switch")) {
        const { clientWidth } = document.querySelector(".offer-attr-switch");
        return clientWidth;
      } else {
        return 0;
      }
    }
    return compare(document);
  });
  if (attrSwitch) {
    postion = await page.evaluate(() => {
      const { top, left } = document
        .querySelector(".offer-attr-switch")
        .getBoundingClientRect();
      return { btn_left: left, btn_top: top };
    });
    page.mouse.click(postion.btn_left + 5, postion.btn_top + 3);
  }
  // 获取数据部分
  json = await page.evaluate(() => {
    console.log("获取头图");

    const video = document.querySelector(
      ".detail-video-wrapper .lib-video video"
    )?.src; // 头图视频

    let headImg = [];
    headImgDom = document.querySelectorAll(
      ".detail-gallery-turn-outter-wrapper .detail-gallery-turn-wrapper"
    );
    headImgDom &&
      headImgDom.forEach((item) => {
        headImg.push(item.querySelector(".detail-gallery-img").src);
      });

    const title = document.querySelector(
      ".od-pc-offer-title-contain .title-text"
    )?.textContent; // 商品标题

    console.log("获取sku");
    // 处理sku
    const skusDom = document.querySelectorAll(
      "#sku-count-widget-wrapper .sku-item-wrapper"
    );
    let skus = [];
    const reg =
      /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    skusDom &&
      skusDom.forEach((item) => {
        skus.push({
          name: item.querySelector(".sku-item-name").textContent,
          price: item.querySelector(".discountPrice-price").textContent,
          img: item
            .querySelector(".sku-item-image")
            .style.background.match(reg)[0],
        });
      });

    console.log("获取跨境属性");
    // 跨境属性
    const borderDom = document.querySelectorAll(
      ".od-pc-offer-cross .offer-attr-list .offer-attr-item"
    );
    let crossBorder = {};
    borderDom &&
      borderDom.forEach((item) => {
        crossBorder[item.querySelector(".offer-attr-item-name").textContent] =
          item.querySelector(".offer-attr-item-value").textContent;
      });

    console.log("获取商品属性");

    // 商品属性
    const productDom = document.querySelectorAll(
      ".od-pc-attribute .offer-attr .offer-attr-list .offer-attr-item"
    );
    let productAttr = {};
    productDom &&
      productDom.forEach((item) => {
        productAttr[item.querySelector(".offer-attr-item-name").textContent] =
          item.querySelector(".offer-attr-item-value").textContent;
      });
    console.log("获取视频展示");

    // 视频展示
    detailVieo = document.querySelector(
      ".detail-video-module .detail-video-wrapper video"
    )?.src;
    console.log("获取商品信息图");

    // 商品信息图
    let detailImgs = [];
    const detailImgDom = document.querySelectorAll(
      ".detail-desc-module .content-detail .desc-img-no-load"
    );
    detailImgDom &&
      detailImgDom.forEach((item) => {
        detailImgs.push(item?.dataset?.lazyloadSrc);
      });
    console.log("获取结束");
    return {
      video,
      headImg,
      title,
      skus,
      crossBorder,
      productAttr,
      detailVieo,
      detailImgs,
    };
  });

  return json;
};

const getinfo = async () => {
  infourl = await input({
    message: "输入包含info.xlsx的文件夹地址，例如~/Downloads/",
  });
};

const geturl = async () => {
  url = await input({
    message: "输入商品的地址：",
  });
};
// 发请求下载图片并保存到本地
const requestPromise = (fileURL, downloadPath) => {
  const file = fs.createWriteStream(downloadPath);
  return new Promise((resolve, reject) => {
    https.get(fileURL, function (response) {
      response.pipe(file);
      file
        .on("finish", function () {
          file.close();
          resolve();
        })
        .on("error", function () {
          reject();
        });
    });
  });
};

const fn = async () => {
  await geturl();
  let info = await getQuotes();
  console.log(info);
  console.log("准备导入数据到excel");
  var sheets = xlsx.parse(infourl + "info.xlsx");
  var normalData = sheets[0].data;
  // 商品链接	商品名称	商品头图	头图视频	SKU名称	SKU价格	SKU图片	跨境属性	商品属性	视频	商品描述
  normalData.push([
    url,
    info.title,
    info.headImg.join(";"),
    info.video,
    JSON.stringify(info.skus),
    JSON.stringify(info.crossBorder),
    JSON.stringify(info.productAttr),
    info.detailVieo,
    info.detailImgs.join(";"),
  ]);
  var data = [
    {
      name: "sheet1",
      data: normalData,
    },
  ];
  // console.log(JSON.stringify(data));
  var buffer = xlsx.build(data);
  // 写入文件
  fs.writeFile(infourl + "info.xlsx", buffer, function (err) {
    if (err) {
      console.log("写入失败： " + err);
      return;
    }
    console.log("写入成功");
  });

  console.log("准备下载视频和图片");
  if (!fs.existsSync(infourl + info.title)) fs.mkdirSync(infourl + info.title);
  console.log("下载头图视频和图片");

  if (!fs.existsSync(infourl + info.title + "/头图"))
    fs.mkdirSync(infourl + info.title + "/头图");
  await Promise.all(
    info.headImg.map(async (item, index) => {
      const fileURL = item;
      const fileName = index + ".png";
      const downloadPath = infourl + info.title + "/头图/" + fileName;
      await requestPromise(fileURL, downloadPath);
    })
  );

  console.log("下载sku图片");
  if (!fs.existsSync(infourl + info.title + "/sku图片"))
    fs.mkdirSync(infourl + info.title + "/sku图片");

  await Promise.all(
    info.skus.map(async (item, index) => {
      const fileURL = item.img;
      const fileName = item.name + ".png";
      const downloadPath = infourl + info.title + "/sku图片/" + fileName;
      await requestPromise(fileURL, downloadPath);
    })
  );

  console.log("下载商品详情图片");
  if (!fs.existsSync(infourl + info.title + "/商品详情图片"))
    fs.mkdirSync(infourl + info.title + "/商品详情图片");

  await Promise.all(
    info.detailImgs.map(async (item, index) => {
      const fileURL = item;
      const fileName = index + ".png";
      const downloadPath = infourl + info.title + "/商品详情图片/" + fileName;
      await requestPromise(fileURL, downloadPath);
    })
  );

  await requestPromise(info.video, infourl + info.title + "/头图视频.mp4");
  await requestPromise(
    info.detailVieo,
    infourl + info.title + "/商品详情视频.mp4"
  );

  console.log(url);
  console.log(infourl);
  fn();
};

main = async () => {
  await getinfo();
  fn();
};

main();
