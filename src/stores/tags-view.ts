import type { LocationQuery } from "vue-router";
import { isExternal } from "@/utils";

/**
 * 标签视图对象
 */
export interface TagView {
  name: string; // 路由名称
  title: string; // 标签名称
  path: string; // 路径
  fullPath: string; // 完整路径
  icon?: string; // 图标
  affix?: boolean; // 固定
  keepAlive?: boolean; // 是否缓存
  query?: LocationQuery; // 路由参数
}

/**
 * 普通返回接口
 */
export interface TagsViewResult {
  visitedViews: TagView[];
  cachedViews: string[];
}

/**
 * 方向删除返回接口
 */
export interface DirectionalTagsViewResult {
  visitedViews: TagView[];
}

/**
 * 标签视图存储
 */
export const useTagsViewStore = defineStore("tagsView", () => {
  const visitedViews = ref<TagView[]>([]);
  const cachedViews = ref<string[]>([]);
  const router = useRouter();
  const route = useRoute();

  /**
   * 添加已访问视图到已访问视图列表中
   */
  function addVisitedView(view: TagView) {
    // 如果已经存在于已访问的视图列表中或者是重定向地址，则不再添加
    if (view.path.startsWith("/redirect") || isExternal(view.path) || isExternal(view.fullPath)) {
      return;
    }
    if (visitedViews.value.some((v) => v.path === view.path)) {
      return;
    }
    // 如果视图是固定的（affix），则在已访问的视图列表的开头添加
    if (view.affix) {
      visitedViews.value.unshift(view);
    } else {
      // 如果视图不是固定的，则在已访问的视图列表的末尾添加
      visitedViews.value.push(view);
    }
  }

  /**
   * 添加缓存视图到缓存视图列表中
   */
  function addCachedView({ fullPath, keepAlive }: TagView) {
    // 如果缓存视图名称已经存在于缓存视图列表中，则不再添加
    if (cachedViews.value.includes(fullPath)) {
      return;
    }

    // 如果视图需要缓存（keepAlive），则将其路由名称添加到缓存视图列表中
    if (keepAlive) {
      cachedViews.value.push(fullPath);
    }
  }

  /**
   * 从已访问视图列表中删除指定的视图
   */
  async function delVisitedView(view: TagView) {
    for (const [i, v] of visitedViews.value.entries()) {
      // 找到与指定视图路径匹配的视图，在已访问视图列表中删除该视图
      if (v.path === view.path) {
        visitedViews.value.splice(i, 1);
        break;
      }
    }
    // 这里的 return 会自动被包装成 Promise.resolve([...])
    return [...visitedViews.value];
  }

  /**
   * 从缓存视图列表中删除指定的视图
   */
  async function delCachedView(view: TagView) {
    const { fullPath } = view;
    const index = cachedViews.value.indexOf(fullPath);
    if (index > -1) {
      cachedViews.value.splice(index, 1);
    }
    return [...cachedViews.value];
  }

  /**
   * 删除其他已访问的视图
   */
  async function delOtherVisitedViews(view: TagView) {
    visitedViews.value = visitedViews.value.filter((v) => {
      return v?.affix || v.path === view.path;
    });
    return [...visitedViews.value];
  }
  /**
   * 删除其他缓存的视图
   */
  async function delOtherCachedViews(view: TagView) {
    const { fullPath } = view;
    const index = cachedViews.value.indexOf(fullPath);
    if (index > -1) {
      cachedViews.value = cachedViews.value.slice(index, index + 1);
    } else {
      // if index = -1, there is no cached tags
      cachedViews.value = [];
    }
    return [...cachedViews.value];
  }

  /**
   * 更新已访问的视图
   */
  function updateVisitedView(view: TagView) {
    for (const v of visitedViews.value) {
      if (v.path === view.path) {
        Object.assign(v, view);
        break;
      }
    }
  }

  /**
   * 根据路径更新标签名称
   * @param fullPath 路径
   * @param title 标签名称
   */
  function updateTagName(fullPath: string, title: string) {
    const tag = visitedViews.value.find((tag: TagView) => tag.fullPath === fullPath);

    if (tag) {
      tag.title = title;
    }
  }

  /**
   * 添加视图
   */
  function addView(view: TagView) {
    addVisitedView(view);
    addCachedView(view);
  }

  /**
   * 删除视图
   */
  async function delView(view: TagView): Promise<TagsViewResult> {
    await Promise.all([delVisitedView(view), delCachedView(view)]);
    return {
      visitedViews: [...visitedViews.value],
      cachedViews: [...cachedViews.value],
    };
  }

  /**
   * 删除其他视图
   */
  async function delOtherViews(view: TagView): Promise<TagsViewResult> {
    await Promise.all([delOtherVisitedViews(view), delOtherCachedViews(view)]);
    return {
      visitedViews: [...visitedViews.value],
      cachedViews: [...cachedViews.value],
    };
  }

  /**
   * 删除左侧视图
   */
  async function delLeftViews(view: TagView): Promise<DirectionalTagsViewResult> {
    const currentIndex = visitedViews.value.findIndex((v) => v.path === view.path);
    if (currentIndex === -1) {
      return {
        visitedViews: [...visitedViews.value],
      };
    }
    visitedViews.value = visitedViews.value.filter((item, index) => {
      if (index >= currentIndex || item?.affix) {
        return true;
      }
      const cachedIndex = cachedViews.value.indexOf(item.fullPath);
      if (cachedIndex > -1) {
        cachedViews.value.splice(cachedIndex, 1);
      }
      return false;
    });
    return {
      visitedViews: [...visitedViews.value],
    };
  }

  /**
   * 删除右侧视图
   */
  async function delRightViews(view: TagView): Promise<DirectionalTagsViewResult> {
    const currentIndex = visitedViews.value.findIndex((v) => v.path === view.path);
    if (currentIndex === -1) {
      return {
        visitedViews: [...visitedViews.value],
      };
    }
    visitedViews.value = visitedViews.value.filter((item, index) => {
      if (index <= currentIndex || item?.affix) {
        return true;
      }
      const cachedIndex = cachedViews.value.indexOf(item.fullPath);
      if (cachedIndex > -1) {
        cachedViews.value.splice(cachedIndex, 1);
      }
      return false;
    });
    return {
      visitedViews: [...visitedViews.value],
    };
  }

  /**
   * 删除所有视图
   */
  async function delAllViews(): Promise<TagsViewResult> {
    const affixTags = visitedViews.value.filter((tag) => tag?.affix);
    visitedViews.value = affixTags;
    cachedViews.value = [];
    return {
      visitedViews: [...visitedViews.value],
      cachedViews: [...cachedViews.value],
    };
  }

  /**
   * 删除所有已访问的视图
   */
  async function delAllVisitedViews() {
    const affixTags = visitedViews.value.filter((tag) => tag?.affix);
    visitedViews.value = affixTags;
    return [...visitedViews.value];
  }

  /**
   * 删除所有缓存的视图
   */
  async function delAllCachedViews() {
    cachedViews.value = [];
    return [...cachedViews.value];
  }

  /**
   * 判断当前标签是否激活
   */
  function isActive(tag: TagView) {
    return tag.path === route.path;
  }

  /**
   * 跳转到上一次访问的页面
   */
  function toLastView(visitedViews: TagView[], view?: TagView) {
    const latestView = visitedViews.slice(-1)[0];
    if (latestView && latestView.fullPath) {
      router.push(latestView.fullPath);
    } else {
      // now the default is to redirect to the home page if there is no tags-view,
      // you can adjust it according to your needs.
      if (view?.name === "Dashboard") {
        // to reload home page
        router.replace("/redirect" + view.fullPath);
      } else {
        router.push("/");
      }
    }
  }

  /**
   * 关闭当前tagView
   */
  function closeCurrentView() {
    const tags: TagView = {
      name: route.name as string,
      title: route.meta.title as string,
      path: route.path,
      fullPath: route.fullPath,
      icon: route.meta?.icon as string | undefined,
      affix: route.meta?.affix,
      keepAlive: route.meta?.keepAlive,
      query: route.query,
    };
    delView(tags).then((res) => {
      if (isActive(tags)) {
        toLastView(res.visitedViews, tags);
      }
    });
  }

  return {
    visitedViews,
    cachedViews,
    addVisitedView,
    addCachedView,
    delVisitedView,
    delCachedView,
    delOtherVisitedViews,
    delOtherCachedViews,
    updateVisitedView,
    addView,
    delView,
    delOtherViews,
    delLeftViews,
    delRightViews,
    delAllViews,
    delAllVisitedViews,
    delAllCachedViews,
    closeCurrentView,
    isActive,
    toLastView,
    updateTagName,
  };
});
