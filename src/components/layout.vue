

<template>
  <div class="layout">
    <div class="menu">
      <el-tooltip placement="left">
        <template #content>
          <div @click="show(1)">中国地图</div>
          <div @click="show(2)">机房监控</div>
          <!-- <div @click="show(3)">灯光建筑</div> -->
        </template>
        <span>案例切换</span>
      </el-tooltip>
    </div>
    <Map v-if="flag == 1"/>
    <Building v-if="flag == 2"/>
    <city v-if="flag == 3"/>
  </div>
</template>

<script setup>
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
