<template>
  <MainLayout>
    <div class="ca-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">NÓMINA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Control de Asistencia</span>
      </div>

      <!-- HEADER -->
      <div class="ca-header">
        <div class="ca-header-icon">
          <v-icon size="28" color="white">mdi-qrcode-scan</v-icon>
        </div>
        <div class="ca-header-text">
          <h2 class="ca-title">Control de Asistencia Anti-Fraude</h2>
          <p class="ca-subtitle">Marcaje de entrada/salida por Centro de Costo con detección automática de suplantación</p>
        </div>
        <div class="ca-badge">
          <v-icon size="14" color="#f59e0b">mdi-hammer-wrench</v-icon>
          EN ELABORACIÓN
        </div>
      </div>

      <!-- RESUMEN -->
      <div class="ca-intro">
        <p>
          Este módulo permitirá que cada empleado marque su entrada y salida escaneando un
          <strong>código QR dinámico</strong> asignado a su Centro de Costo, evitando que un compañero
          marque por otro ("buddy punching"). El sistema detectará y alertará automáticamente
          cuando se detecte un intento de fraude.
        </p>
      </div>

      <!-- FLUJO DE FUNCIONAMIENTO -->
      <div class="ca-section">
        <div class="ca-section-title">
          <v-icon size="18" color="#be185d">mdi-sitemap-outline</v-icon>
          Cómo funcionará
        </div>

        <div class="ca-flow">
          <div class="ca-flow-step">
            <div class="ca-flow-num">1</div>
            <div class="ca-flow-body">
              <div class="ca-flow-title">QR dinámico por Centro de Costo</div>
              <div class="ca-flow-desc">
                Cada punto de trabajo muestra en una pantalla/tablet un código QR que se
                regenera automáticamente cada 20–30 segundos. Esto impide que alguien tome
                una foto del código y lo reutilice más tarde.
              </div>
            </div>
          </div>

          <div class="ca-flow-step">
            <div class="ca-flow-num">2</div>
            <div class="ca-flow-body">
              <div class="ca-flow-title">Escaneo desde el celular del empleado</div>
              <div class="ca-flow-desc">
                El empleado abre la cámara/app y escanea el QR vigente. El sistema
                identifica automáticamente quién marcó, en qué CC y a qué hora exacta.
              </div>
            </div>
          </div>

          <div class="ca-flow-step">
            <div class="ca-flow-num">3</div>
            <div class="ca-flow-body">
              <div class="ca-flow-title">Verificación de ubicación (GPS)</div>
              <div class="ca-flow-desc">
                Se captura la geolocalización del celular al momento del escaneo y se valida
                que esté dentro del radio configurado para ese Centro de Costo (geofence).
              </div>
            </div>
          </div>

          <div class="ca-flow-step">
            <div class="ca-flow-num">4</div>
            <div class="ca-flow-body">
              <div class="ca-flow-title">Huella del dispositivo (Device Fingerprint)</div>
              <div class="ca-flow-desc">
                Se genera un identificador único del celular usado (a partir de user-agent,
                resolución de pantalla, zona horaria, canvas fingerprint, etc.) y se guarda
                junto con cada marcaje. La MAC address no es accesible desde el navegador
                por restricciones de privacidad de Android/iOS, por lo que este fingerprint
                es el sustituto más cercano disponible en la web.
              </div>
            </div>
          </div>

          <div class="ca-flow-step ca-flow-step--alert">
            <div class="ca-flow-num ca-flow-num--alert">5</div>
            <div class="ca-flow-body">
              <div class="ca-flow-title">Detección de fraude automática</div>
              <div class="ca-flow-desc">
                Si <strong>dos empleados distintos</strong> marcan usando el
                <strong>mismo dispositivo</strong> (mismo fingerprint) dentro de una ventana
                corta de tiempo (ej. 5 minutos), el sistema genera una
                <strong>alerta de posible fraude</strong> automática hacia Gerencia/Recursos
                Humanos, indicando: empleados involucrados, CC, hora y evidencia del
                dispositivo compartido.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LIMITACIONES -->
      <div class="ca-section">
        <div class="ca-section-title">
          <v-icon size="18" color="#f59e0b">mdi-alert-outline</v-icon>
          Limitaciones conocidas
        </div>
        <ul class="ca-list">
          <li>El <em>device fingerprint</em> no es 100% infalible — un usuario técnico avanzado
            podría evadirlo (modo incógnito, borrar caché), aunque esto es poco común en el
            uso diario de un empleado.</li>
          <li>No se puede obtener la MAC address real del celular por restricciones de
            seguridad de los sistemas operativos modernos.</li>
          <li>Para un nivel de seguridad superior (a futuro) se podría evaluar una
            <strong>app nativa</strong> (React Native / Capacitor) con un Device ID
            persistente, o incorporar verificación por selfie como segunda capa.</li>
        </ul>
      </div>

      <!-- ESTADO ACTUAL -->
      <div class="ca-status">
        <v-icon size="20" color="#f59e0b">mdi-progress-clock</v-icon>
        <div>
          <div class="ca-status-title">Próximos pasos</div>
          <div class="ca-status-desc">
            Esta funcionalidad está pendiente de desarrollo. Se implementará más adelante:
            generación de QR dinámico por Centro de Costo, endpoint de marcaje con captura de
            GPS + fingerprint, tabla de historial de marcajes, y el motor de detección de
            fraude con notificaciones automáticas.
          </div>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../../components/layouts/MainLayout.vue'
</script>

<style scoped>
.ca-container { padding: 0 0 32px; }

/* BREADCRUMB */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.ca-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.ca-header-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #be185d, #831843);
  display: flex; align-items: center; justify-content: center;
}
.ca-header-text { flex: 1; }
.ca-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); text-transform: uppercase; }
.ca-subtitle { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.ca-badge {
  display: flex; align-items: center; gap: 6px;
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* INTRO */
.ca-intro {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
}
.ca-intro p { font-size: 14px; line-height: 1.6; color: rgba(var(--v-theme-on-surface), 0.75); margin: 0; }

/* SECTIONS */
.ca-section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 22px 24px;
  margin-bottom: 20px;
}
.ca-section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 18px;
}

/* FLOW */
.ca-flow { display: flex; flex-direction: column; gap: 16px; }
.ca-flow-step { display: flex; gap: 14px; }
.ca-flow-num {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: rgba(190, 24, 93, 0.12); color: #be185d;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
}
.ca-flow-num--alert { background: rgba(239, 68, 68, 0.14); color: #ef4444; }
.ca-flow-step--alert .ca-flow-title { color: #ef4444; }
.ca-flow-body { flex: 1; }
.ca-flow-title { font-size: 13.5px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin-bottom: 3px; }
.ca-flow-desc { font-size: 13px; line-height: 1.55; color: rgba(var(--v-theme-on-surface), 0.6); }

/* LIST */
.ca-list { margin: 0; padding-left: 20px; }
.ca-list li { font-size: 13px; line-height: 1.6; color: rgba(var(--v-theme-on-surface), 0.65); margin-bottom: 10px; }
.ca-list li:last-child { margin-bottom: 0; }

/* STATUS */
.ca-status {
  display: flex; gap: 14px; align-items: flex-start;
  background: rgba(245, 158, 11, 0.06);
  border: 1px dashed rgba(245, 158, 11, 0.35);
  border-radius: 12px;
  padding: 18px 22px;
}
.ca-status-title { font-size: 13.5px; font-weight: 800; color: #f59e0b; margin-bottom: 4px; }
.ca-status-desc { font-size: 13px; line-height: 1.6; color: rgba(var(--v-theme-on-surface), 0.65); }
</style>
