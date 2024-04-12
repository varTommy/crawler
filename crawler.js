// import puppeteer from "puppeteer";
const puppeteer = require("puppeteer");

let page = null;
let btn_position = null;
let times = 0; // 执行重新滑动的次数
const distanceError = [-10, 2, 3, 5]; // 距离误差

const getQuotes = async () => {
  const browser = await puppeteer.launch({
    headless: false, //使无头浏览器可见，便于开发过程中观察
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
    page.mouse.move(btn_position.btn_left + distance, btn_position.btn_top, {
      steps: 30,
    });
  }
};

getQuotes();
