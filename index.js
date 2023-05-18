/*
 * @Author: gmx
 * @Date: 2023-04-28 13:09:14
 * @LastEditors: gmx
 * @LastEditTime: 2023-05-18 13:34:31
 * @Description:
 * @Version: 1.0
 */
/**
 * @description: 创建li歌词dom
 * @return {*}
 * @author: gmx
 */
function generateLrc() {
  const lrcArr = parseLrc(Lrc);
  var frag = document.createDocumentFragment();
  for (let i = 0; i < lrcArr.length; i++) {
    var li = document.createElement("li");
    li.textContent = lrcArr[i].words;
    frag.appendChild(li);
  }
  doms.ul.appendChild(frag);
  return lrcArr;
}

/**
 * @description: 处理歌词格式
 * @return lrc array
 * @author: gmx
 */
function parseLrc(lrcStr) {
  var lines = lrcStr.split("\n");
  const lrcArr = [];
  for (let i = 0; i < lines.length; i++) {
    let [times, words] = lines[i].split("]");
    lrcArr.push({ times: parseTime(times.substring(1)), words: words });
  }
  return lrcArr;
}

/**
 * @description: 分秒转换为秒
 * @return {*}
 * @author: gmx
 */
function parseTime(timeStr) {
  var [minite, other] = timeStr.split(":");
  var [second, _] = other.split(".");
  var seconds = Number(minite) * 60 + Number(second);
  return seconds;
}

/**
 * @description: 查找高亮歌词的index
 * @return {*}
 * @author: gmx
 */
function findIndex() {
  var currentTime = doms.audio.currentTime;
  var index = lrcArr.findIndex((e) => e.times > currentTime);
  if (index === -1) {
    index = lrcArr.length;
  }
  return index - 1;
}

/**
 * @description: 歌词偏移及高亮
 * @return {*}
 * @author: gmx
 */
function setOffset() {
  var index = findIndex();
  var offset = liHeight * index + liHeight / 2 - containerHeight / 2;
  if (offset < 0) {
    offset = 0;
  } else if (offset > maxOffset) {
    offset = maxOffset;
  }
  doms.ul.style.transform = `translateY(-${offset}px)`;
  // 去掉前行歌词高亮
  var li = document.querySelector(".active");
  if (li) {
    li.classList.remove("active");
  }
  doms.ul.children[index]?.classList.add("active");
}

// 获取dom
var doms = {
  audio: document.querySelector("audio"),
  ul: document.querySelector("ul"),
  container: document.querySelector(".container"),
};
const lrcArr = generateLrc();
// 容器高度
var containerHeight = doms.container.clientHeight;
var liHeight = doms.ul.children[0].clientHeight;
// 最大偏移量
var maxOffset = doms.ul.clientHeight - containerHeight;

doms.audio.addEventListener("timeupdate", setOffset);

// 画布
const WIDTH = 360;
const HEIGHT = 100;
var canvas = document.querySelector("#audio");
var ctx = canvas.getContext("2d");
function draw(dataArray, maxValue) {
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  var barWidth = (WIDTH / bufferLength) * 2.5;
  var barHeight;
  var x = 0;
  for (let i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i] > maxValue ? maxValue : dataArray[i];

    ctx.fillStyle = `rgb(${barHeight}, 150, 150)`;
    ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

let isInit = false;
let analyser, bufferArray, source, bufferLength;
const maxValue = 512;
doms.audio.onplay = function () {
  if (isInit) {
    return;
  }
  const audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  bufferLength = analyser.frequencyBinCount;
  bufferArray = new Uint8Array(bufferLength);

  source = audioCtx.createMediaElementSource(doms.audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  isInit = true;
};
function update() {
  requestAnimationFrame(update);
  if (!isInit) {
    return;
  }
  isInit = true;
  analyser.getByteFrequencyData(bufferArray);
  // 均衡数据
  const normalData = MinMaxScale(bufferArray)

  draw(normalData);
}

function MinMaxScale(dataArr) {
  let datamin = Math.max(...dataArr)
  let datamax = Math.min(...dataArr)
  return dataArr.map(item => (item - datamin) / (datamax - datamin) * HEIGHT * 0.8)
}

// update();
