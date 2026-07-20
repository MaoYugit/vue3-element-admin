<template>
  <div :class="['layout-tabs', tabsStyleClass]">
    <el-scrollbar
      ref="scrollbarRef"
      class="layout-tabs__scroll"
      :view-style="{ height: '100%' }"
      @wheel="handleScroll"
    >
      <div class="layout-tabs__List">
        <div
          v-for="tag in visitedViews"
          :key="tag.fullPath"
          class="layout-tabs__item"
          :class="{
            'is-active': tagsViewStore.isActive(tag),
            'is-affix': tag.affix,
          }"
          @click="openTag(tag)"
          @click.middle="handleMiddleClick(tag)"
          @contextmenu.prevent="openContextMenu(tag, $event)"
        >
          <template v-if="tag.icon"></template>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore, useTagsViewStore } from "@/stores";
import { TagsViewStyle } from "@/enums";
import { isExternal } from "@/utils";
import router from "@/router";
import type { TagView } from "@/stores/tags-view";

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
}

const settingsStore = useSettingsStore();

const scrollbarRef = ref();
const tagsViewStore = useTagsViewStore();

const { visitedViews } = storeToRefs(tagsViewStore);

const contextMenu = reactive<ContextMenu>({
  visible: false,
  x: 0,
  y: 0,
});

const tabsStyleClass = computed(() => {
  switch (settingsStore.tagsViewStyle) {
    case TagsViewStyle.CARD:
      return "layout-tabs--card";
    case TagsViewStyle.LINE:
    default:
      return "layout-tabs=--line";
  }
});

const openTag = (tag: TagView) => {
  if (isExternal(tag.fullPath)) {
    window.open(tag.fullPath, "_blank", "noopener, noreferrer");
    return;
  }

  router.push({
    path: tag.fullPath,
    query: tag.query,
  });
};

const closeSelectedTag = (tag: TagView | null) => {
  if (!tag) return;

  tagsViewStore.delView(tag).then((result) => {
    if (tagsViewStore.isActive(tag)) {
      tagsViewStore.toLastView(result.visitedViews, tag);
    }
  });
};
const handleMiddleClick = (tag: TagView) => {
  if (!tag.affix) {
    closeSelectedTag(tag);
  }
};
const closeContextMenu = () => {
  contextMenu.visible = false;
};
const handleScroll = (event: WheelEvent) => {
  closeContextMenu();

  const scrollWrapper = scrollbarRef.value?.wrapRef;
  if (!scrollWrapper) return;

  const hasHorizontalScroll = scrollWrapper.scrollWidth > scrollWrapper.clientWidth;
  if (!hasHorizontalScroll) return;

  const legacyEvent = event as WheelEvent & { wheelDelta?: number };
  const deltaY = event.deltaY || -(legacyEvent.wheelDelta ?? 0);
  const newScrollLeft = scrollWrapper.scrollLeft + deltaY;

  scrollbarRef.value.setScrollLeft(newScrollLeft);
};
</script>

<style lang="scss" scoped>
.layout-tabs {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  width: 100%;
  height: $tags-view-height;
  padding: 0 10px;
  background-color: var(--content-bg);
  border-bottom: 1px solid var(--card-border);
}

.layout-tabs__scroll {
  flex: 1;
  min-width: 0;
  height: 100%;

  :deep(.el-scrollbar__wrap) {
    overflow-y: hidden;
  }
}

.layout0-tabs__item {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  height: 26px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  background-color: #f8fafc;
  border: 1px solid var(--card-border);
  border-radius: 2px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;

  &.is-active {
    font-weight: 500;
    color: var(--el-color-primary);
    background-color: var(--content-bg);
    border-color: var(--el-color-primary-light-5);

    .layout-tabs__item-icon {
      color: var(--el-color-primary);
      opacity: 1;
    }

    .layout-tabs__item-close {
      opacity: 0.6;

      &:hover {
        background-color: var(--el-color-primary-light-7);
        opacity: 1;
      }
    }
  }

  &.is-affix {
    .layout-tabs__item-text {
      font-weight: 500;
    }
  }
}
</style>
