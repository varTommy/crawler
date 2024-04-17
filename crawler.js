// import puppeteer from "puppeteer";
const puppeteer = require("puppeteer");

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
  await page.goto(
    "https://detail.1688.com/offer/682775226398.html?spm=a360q.8274423.0.0.7b854c9a4vJrSY",
    { waitUntil: "networkidle0", timeout: 5000 }
  ); //访问页面
  await page.evaluate(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
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
    await sleep(3000);
    page.mouse.up();
  }

  // 等页面加载
  await sleep(5000);
  page.evaluate((_) => {
    window.scrollBy(0, window.innerHeight);
  });
  await sleep(1000);
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
    const video = document.querySelector(
      ".detail-video-wrapper .lib-video video"
    )?.src; // 头图视频
    const title = document.querySelector(
      ".od-pc-offer-title-contain .title-text"
    )?.textContent; // 商品标题
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

    // 视频展示
    detailVieo = document.querySelector(
      ".detail-video-module .detail-video-wrapper video"
    )?.src;

    // 商品信息图
    let detailImgs = [];
    const detailImgDom = document.querySelectorAll(
      ".detail-desc-module .content-detail .desc-img-no-load"
    );
    detailImgDom &&
      detailImgDom.forEach((item) => {
        detailImgs.push(item?.dataset?.lazyloadSrc);
      });

    return {
      video,
      title,
      skus,
      crossBorder,
      productAttr,
      detailVieo,
      detailImgs,
    };
  });
  console.log(json);
};

getQuotes();
