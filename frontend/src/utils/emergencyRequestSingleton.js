import { emergencyRequestApi } from '@services/emergencyRequestApi';

/** Один in-flight POST на монтинг (React StrictMode и двойные эффекты не создают две заявки). */
let createInflight = null;

export function createEmergencyRequestOnce() {
  if (!createInflight) {
    createInflight = emergencyRequestApi
      .create()
      .finally(() => {
        window.setTimeout(() => {
          createInflight = null;
        }, 2000);
      });
  }
  return createInflight;
}
