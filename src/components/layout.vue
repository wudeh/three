

<template>
  <div class="layout">
    <div class="menu">
      <el-tooltip placement="left">
        <template #content>
          <div @click="show(1)">旋转地球</div>
          <div @click="show(2)">中国地图</div>
          <div @click="show(3)">机房监控</div>
          <!-- <div @click="show(3)">灯光建筑</div> -->
        </template>
        <span>案例切换</span>
      </el-tooltip>
    </div>
    <Earth v-if="flag == 1"/>
    <Map v-if="flag == 2"/>
    <Building v-if="flag == 3"/>
    <city v-if="flag == 99"/>
  </div>
</template>

<script setup>
import Earth from "./earth/index.vue"
import Map from "./map.vue"
import Building from "./building.vue";
import city from "./city.vue";
import { ref } from "vue";

const flag = ref(1)
const show = (v) => {
  flag.value = v
}

</script>

<style scoped>
.layout {
  width: 100%;
  height: 100%;
  position: relative;
}
/* 场景演示 */
.menu {
    position: absolute;
    color: #fff;
    top: 2%;
    left: 2%;
    z-index: 1000;
}
</style>
