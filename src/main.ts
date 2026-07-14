import { createApp } from "vue";
import App from "./App.vue";

// 全局样式引入
import "element-plus/theme-chalk/dark/css-vars.css";
import "@/styles/index.scss";
import "uno.css";
import "animate.css";

// 注册全局自定义指令 (v-hasPerm)
import { setupDirective } from "@/directives";
// 安装路由 (vue-router, hash 模式)
import { setupRouter } from "@/router";
// 安装状态管理 (Pinia, 7 个 store)
import { setupStore } from "@/stores";
// 安装国际化插件 (vue-i18n)
import { setupI18n } from "@/lang";
// 全局注册 Element Plus 图标
import * as ElementPlusIcons from "@element-plus/icons-vue";
// 注册导航守卫 (权限/登录/动态路由)
import { setupPermissionGuard } from "@/router/guards/permission";
// 启动 SSE 长连接服务
import { setupSse } from "@/composables";

// 创建实例
const app = createApp(App);

// 注册全局指令
setupDirective(app);
// 安装国际化
setupI18n(app);
// 安装路由
setupRouter(app);
// 安装状态管理
setupStore(app);

// 全局注册 Element Plus 图标
Object.entries(ElementPlusIcons).forEach(([name, comp]) => app.component(name, comp));

// 注册导航守卫
setupPermissionGuard();
// 启动 SSE 服务
setupSse();

// 挂载应用
app.mount("#app");
