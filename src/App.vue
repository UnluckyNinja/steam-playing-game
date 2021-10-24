<template>
  <div>
    <div v-if="!store.game && !store.key">鼠标悬停此处查看说明</div>
    <span v-if="store.game">游戏：{{ store.game }}</span>
  </div>
  <div class="default-hide">
    <div>
      <div>
        <label for="key">密钥:</label>
        <input id="key" v-model="store.key" type="password" />
      </div>
      <div>
        <label for="key">Steam 64位 ID:</label>
        <input id="key" v-model="store.steamID" type="password" />
      </div>
      <div>
        <label for="key">更新间隔（秒）</label>
        <input
          id="key"
          :value="store.interval / 1000"
          @input="inputInterval"
          type="number"
          autocomplete="off"
        />
      </div>
    </div>
    <h3>如何使用:</h3>
    <p style="font-size: 1rem">(请不要在OBS内点击下方链接)</p>
    <p style="color: red; font-size: 1rem">!! 下方链接会显示隐私信息，如果你正在直播，强烈建议暂时关闭相应捕捉直至完成 !!</p>
    <ol>
      <li>
        打开
        <a href="https://steamcommunity.com/dev/apikey">https://steamcommunity.com/dev/apikey</a>
        获取API密钥，若没生成过则生成一个
      </li>
      <li>
        64位 SteamID 可以在
        <a href="https://steamdb.info/calculator/">https://steamdb.info/calculator/</a>
        或
        <a href="https://steamid.xyz/">https://steamid.xyz/</a>
        获取
      </li>
      <li>
        打开OBS等，添加浏览器源，填入本网页网址，宽度根据常玩的游戏名自动调整，高度100px足够，点击确定保存
        <br />* 自定义参考CSS：
        <pre>body { color: white; background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow-y: auto; }</pre>
      </li>
      <li>右键场景来源中对应项，点击倒数第三项：互动，在打开的窗口内填入对应内容，关闭即可</li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';

const store = useStorage('store', {
  message: '',
  game: '',
  key: '',
  steamID: '',
  interval: 5000
})
const fetchGame = async (key: string, steamID: string) => {
  if (!key || !steamID) return ''
  const res = await fetch('/api/playing/?key=' + store.value.key + '&steamID=' + store.value.steamID)
  store.value.game = (await res.json()).response.players[0].gameextrainfo
}

function setupUpdate(store: any) {
  function newUpdater() {
    return setInterval(() => {
      fetchGame(store.value.key, store.value.steamID)
    }, store.value.interval)
  }
  let updaterID = newUpdater()
  function changeInterval(value = 5000) {
    clearInterval(updaterID)
    store.value.interval = value
    updaterID = newUpdater()
  }
  return { changeInterval }
}

const inputInterval = ($event: Event) => {
  const target = $event.target as HTMLInputElement
  changeInterval(Math.max(1000, parseFloat(target.value) * 1000))
}


const { changeInterval } = setupUpdate(store)
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  max-width: 50vw;
}

#app .default-hide {
  visibility: hidden;
}
#app:hover .default-hide {
  visibility: visible;
}
body {
  font-size: 1.5rem;
  height: 100vh;
  overflow: auto;
}
::-webkit-scrollbar {
  width: 0; /* Remove scrollbar space */
  background: transparent; /* Optional: just make scrollbar invisible */
}
pre {
  white-space: pre-wrap;
}
</style>
