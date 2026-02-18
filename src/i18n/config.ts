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
      "nav.home": "Home",
      "nav.projects": "Projects",
      "settings.language": "Language",
      "settings.theme": "Theme",
      "theme.light": "Light Mode",
      "theme.dark": "Dark Mode",
      "common.save": "Save",
      "common.edit": "Edit",
      "common.delete": "Delete",
      "projects.delete_confirm": "Are you sure you want to delete this project? This action cannot be undone.",
      "project.edit_manifest": "Edit Project Manifest"
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
      "nav.home": "首页",
      "nav.projects": "项目列表",
      "settings.language": "语言",
      "settings.theme": "主题",
      "theme.light": "浅色模式",
      "theme.dark": "深色模式",
      "common.save": "保存",
      "common.edit": "编辑",
      "common.delete": "删除",
      "projects.delete_confirm": "确定要删除此项目吗？此操作无法撤销。",
      "project.edit_manifest": "编辑 Manifest"
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
