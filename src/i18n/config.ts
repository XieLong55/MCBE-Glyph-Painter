import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      "app.title": "MCBE Glyph Painter",
      "home.welcome": "Welcome to MCBE Glyph Painter",
      "home.get_started": "Get Started",
      "projects.title": "My Projects",
      "projects.create": "Create New Project",
      "projects.import": "Import Project",
      "projects.no_projects": "No projects found. Create or import one to get started.",
      "projects.not_found": "Project not found",
      "create.title": "Create New Project",
      "create.name": "Project Name",
      "create.description": "Description",
      "create.version": "Version",
      "create.submit": "Create",
      "create.cancel": "Cancel",
      "create.header_info": "Header Information",
      "create.header_info_desc": "General information about the resource pack.",
      "create.module_info": "Module Information",
      "create.module_info_desc": "Details for the resource pack module.",
      "create.module_desc": "Module Description (Optional)",
      "create.module_desc_placeholder": "Leave empty to use header description...",
      "create.note": "Note:",
      "create.uuid_note": "UUIDs for both the project header and module will be automatically generated.",
      "import.title": "Import Project",
      "import.select_file": "Select .zip or .mcpack file",
      "import.verify": "Verify Project Details",
      "import.submit": "Import",
      "import.type": "Type",
      "import.desc": "Desc",
      "import.ver": "Ver",
      "import.no_modules": "No modules found.",
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.back": "Back",
      "common.save": "Save",
      "common.export": "Export",
      "common.confirm": "Confirm",
      "common.cancel": "Cancel",
      "theme.light": "Light",
      "theme.dark": "Dark",
      "theme.system": "System",
      "project.overview": "Overview",
      "project.glyphs": "Glyph Editor",
      "project.textures": "Textures",
      "project.settings": "Settings",
      "project.edit": "Edit",
      "project.delete": "Delete",
      "project.delete_confirm_title": "Delete Project",
      "project.delete_confirm_body": "Are you sure you want to delete this project? This action cannot be undone."
    }
  },
  zh: {
    translation: {
      "app.title": "MCBE Glyph Painter",
      "home.welcome": "欢迎使用 MCBE Painter",
      "home.get_started": "立即开始",
      "projects.title": "我的项目",
      "projects.create": "新建项目",
      "projects.import": "导入项目",
      "projects.no_projects": "未找到项目。请新建或导入一个项目以开始。",
      "projects.not_found": "未找到该项目",
      "create.title": "新建项目",
      "create.name": "项目名称",
      "create.description": "描述",
      "create.version": "版本",
      "create.submit": "创建",
      "create.cancel": "取消",
      "create.header_info": "标头信息",
      "create.header_info_desc": "资源包的基本信息。",
      "create.module_info": "模块信息",
      "create.module_info_desc": "资源包模块的详细信息。",
      "create.module_desc": "模块描述 (可选)",
      "create.module_desc_placeholder": "留空则使用标头描述...",
      "create.note": "注意：",
      "create.uuid_note": "项目标头和模块的 UUID 将自动生成。",
      "import.title": "导入项目",
      "import.select_file": "选择 .zip 或 .mcpack 文件",
      "import.verify": "核对项目详情",
      "import.submit": "导入",
      "import.type": "类型",
      "import.desc": "描述",
      "import.ver": "版本",
      "import.no_modules": "未找到模块。",
      "common.loading": "加载中...",
      "common.error": "错误",
      "common.success": "成功",
      "common.back": "返回",
      "common.save": "保存",
      "common.export": "导出",
      "common.confirm": "确认",
      "common.cancel": "取消",
      "theme.light": "浅色",
      "theme.dark": "深色",
      "theme.system": "跟随系统",
      "project.overview": "项目概览",
      "project.glyphs": "字形编辑",
      "project.textures": "纹理集",
      "project.settings": "项目设置",
      "project.edit": "编辑",
      "project.delete": "删除",
      "project.delete_confirm_title": "删除项目",
      "project.delete_confirm_body": "确定要删除此项目吗？此操作无法撤销。"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already safes from xss
    }
  });

export default i18n;
