<template>
  <div
    class="popover"
    :style="{
      'top': dataRef.top + 'px',
      'left': dataRef.left + 'px',
      'display': isShow ? 'inline-block' : 'none'
    }"
  >
    <div class="popover-title">
      机名：{{ dataRef.name }}
    </div>
    <div class="popover-content">
      <div>温度：{{ dataRef.wendu }}</div>
      <div>流量：{{ dataRef.liuliang }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup name="Popover">
import { ref } from 'vue';

const isShow = ref(false);
const dataRef = ref<any>({});

const setShow = (visible: boolean, data?: any) => {
  isShow.value = visible;
  if (data) dataRef.value = data;
};

defineExpose({
  setShow,
});
</script>

<style scoped>
.popover {
  position: absolute;
  background-color: rgb(29 78 216 / 0.6);
  border-radius: 5px;
  font-size: 20px;
  color: #fff;
  pointer-events: none;
}
.popover-title {
  padding: 12px;
  border-bottom: 1px solid #fff;
}
.popover-content {
  padding: 24px;
}
</style>
