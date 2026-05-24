export const APP_CONSTANTS = {
  ICONS: {
    automation: "/icons/automation.svg",
    whatsapp: "/icons/whatsapp.png",
    gmail: "/icons/gmail.png",
  },

  WORKER_LOGS_TYPES: {
    SUCCESS: 1,
    LOG: 2,
    ERROR: 3,
    INFO: 4,
    WARNING: 5,
  },
   DEPLOYMENT_STATUS : {
    SUCCESS : 1,
    RUNNING : 2,
    FAILED : 3
  },
  PROJECT_STATUS: {
    NEW: 0,
    RUNNING: 1,
    STOPPED: 2,
  },
  INTEGRATIONS_EMAIL: {
    SMTP: 1,
    ZEPTO_MAIL: 2,
  },

  INTEGRATIONS_WHATSAPP: {
    TWILIO: 1,
    META_CLOUD: 2,
  },
  WEBHOOK_LOGS_STATUS: {
    SUCCESS: 1,
    ERROR: 2,
  },
  PROJECT_FRONTEND_FRAMEWORKS: {
    ANGULAR: 1,
    REACT: 2,
    VITE_REACT: 3,
    VITE_VUE: 4,
    VUE: 5,
    NEXT: 6,
    NUXT: 7,
    VITE: 8,
    NODE: 9,
    DOCKER : 10
  }, DEPLOY_TYPE : {
    SSH : 1,
    DOCKER : 2
  }
};
