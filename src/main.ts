import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { Capacitor } from '@capacitor/core';

const mode = () => {
  const platform = Capacitor.getPlatform();
  if(platform === 'android') {
    return 'md';
  } else {
    return 'ios';
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: mode()
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});


