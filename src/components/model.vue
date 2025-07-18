<template>
<div class="box-container">
    <div class='tip-green' >
        <div class="title">设备名称 :测试</div>
        <div class="label-text">
            温度 :
            <span class="mr5 label-value-green" >
            50
            </span>
            <span class="label-value-green">
                正常
            </span>
        </div>
        <div class="label-text">
            漏水 :
            <span class="mr5 label-value-green">
            40
            </span>
            <span class='label-value-green'>
                正常
            </span>
        </div>
    </div>
    <div class=line-green></div>
</div>
</template>

<script setup>

</script>

<style scoped>
:deep(#myDialog) {
    font-size: 8px;

    .box-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: moveUpDown 3s infinite;

        .title {
            font-family: Source Han Sans CN, Source Han Sans CN;
            font-weight: bold;
            color: #fff;
        }

        .label-text {
            font-family: Source Han Sans CN, Source Han Sans CN;
            color: #ccddff;

            .label-value-green {
                color: #5cdd2e;
                font-weight: bold;
            }
            .label-value-red {
                color: #ff4a4a;
                font-weight: bold;
            }
        }

        .tip-green {
            width: 80px;
            height: 40px;
            padding: 5px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: rgba(22, 29, 38, 0.5);
            opacity: 0.9;
            border: 1px solid #329550;
            box-shadow: inset 0px 0px 15px 0px #329550;
        }

        .tip-red {
            width: 80px;
            height: 40px;
            padding: 5px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: rgba(22, 29, 38, 0.5);
            opacity: 0.9;
            border: 1px solid #882c2c;
            box-shadow: inset 0px 0px 15px 0px #882c2c;
        }

        .line-green {
            width: 1px;
            height: 35px;
            background: linear-gradient(to bottom, rgba(28, 107, 51, 0.3), rgb(20, 195, 93), rgba(1, 165, 75, 0.89));
        }

        .line-red {
            width: 1px;
            height: 35px;
            background: linear-gradient(to bottom, rgba(123, 44, 28, 0.3), rgba(255, 82, 82, 1), rgba(255, 48, 48, 0.89));
        }
    }
}
 
/* // 动画 */
@keyframes moveUpDown {
	0% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(8px);
	}
	100% {
		transform: translateY(0);
	}
}
</style>