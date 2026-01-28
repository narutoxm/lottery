/**
 * 游戏轮次设置
 * type: 唯一标识，0是默认特别奖的占位符，其它游戏不可使用
 * count: 总选人数量
 * title: 游戏名称
 * text: 轮次标题
 * fixedUsers: 内定人员名单（按姓名匹配）
 * randomCount: 随机选取人数
 * img: 游戏图片路径
 */
const prizes = [
  {
    type: 0,
    count: 1000,
    title: "",
    text: "特别奖"
  },
  {
    type: 1,
    count: 10,
    text: "第一轮",
    title: "锦鲤蹲蹲乐",
    fixedUsers: ["Thomas", "Seven"],
    randomCount: 8,
    img: "../img/game/5.png"
  },
  {
    type: 2,
    count: 10,
    text: "第二轮",
    title: "蒙眼铲钱",
    fixedUsers: ["Tina", "Jason"],
    randomCount: 8,
    img: "../img/game/6.png"
  },
  {
    type: 3,
    count: 10,
    text: "第三轮",
    title: "数字炸弹",
    fixedUsers: ["James", "Page"],
    randomCount: 8,
    img: "../img/game/7.png"
  },
  {
    type: 5,
    count: 5,
    text: "第四轮",
    title: "蒙眼喝可乐",
    fixedUsers: [],
    randomCount: 5,
    img: "../img/game/5.png",
    allowRepeat: true
  },
  {
    type: 6,
    count: 6,
    text: "第五轮",
    title: "电臀达人",
    fixedUsers: ["詹杭州", "邓相虎", "陈宇杰", "林辉华", "余学勇", "胡明达"],
    randomCount: 0,
    img: "../img/game/6.png"
  }
];

/**
 * 一次抽取的人数与prizes对应（每轮选取总人数）
 * 对应: [Particular, R1, R2, R3, R4, R5]
 */
const EACH_COUNT = [1, 10, 10, 10, 5, 6];

/**
 * 卡片公司名称标识
 */
const COMPANY = "Chidao";

module.exports = {
  prizes,
  EACH_COUNT,
  COMPANY
};
