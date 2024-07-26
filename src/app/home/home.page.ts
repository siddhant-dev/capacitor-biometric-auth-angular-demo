import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  AlertController,
  IonItem,
  IonList,
  IonListHeader,
  IonLabel,
  IonButton,
  IonButtons,
  IonSelect,
  IonCheckbox,
  IonSelectOption,
  IonInput,
  IonIcon,
} from '@ionic/angular/standalone';
import {
  AndroidBiometryStrength,
  AuthenticateOptions,
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
  type CheckBiometryResult,
  getBiometryName,
} from '@aparajita/capacitor-biometric-auth';
import { FormsModule } from '@angular/forms';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { NgFor, NgIf } from '@angular/common';

interface BiometryTypeEntry {
  title: string;
  type: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonItem,
    IonText,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    FormsModule,
    IonList,
    IonListHeader,
    IonLabel,
    IonButtons,
    IonButton,
    IonSelect,
    IonSelectOption,
    NgIf,
    NgFor,
    IonCheckbox,
    IonInput,
    IonIcon,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  BiometryType = BiometryType;
  formModel = {
    biometryType: BiometryType.none,
    isEnrolled: false,
    deviceIsSecure: false,
    onlyUseStrongBiometry: false,
    allowDeviceCredential: false,
    androidConfirmationRequired: false,
    androidTitle: '',
    androidSubtitle: '',
    reason: '',
    cancelTitle: '',
    iosFallbackTitle: '',
  };

  biometryTypes: BiometryTypeEntry[] = [
    { title: 'None', type: BiometryType.none },
    { title: 'Touch ID', type: BiometryType.touchId },
    { title: 'Face ID', type: BiometryType.faceId },
    { title: 'Fingerprint', type: BiometryType.fingerprintAuthentication },
    {
      title: 'Fingerprint + face',
      type:
        BiometryType.fingerprintAuthentication * 10 +
        BiometryType.faceAuthentication,
    },
    {
      title: 'Fingerprint + iris',
      type:
        BiometryType.fingerprintAuthentication * 10 +
        BiometryType.irisAuthentication,
    },
  ];

  biometry: CheckBiometryResult = {
    isAvailable: false,
    strongBiometryIsAvailable: false,
    biometryType: BiometryType.none,
    biometryTypes: [],
    deviceIsSecure: false,
    reason: '',
    code: BiometryErrorType.none,
    strongReason: '',
    strongCode: BiometryErrorType.none,
  };

  appListener: PluginListenerHandle | undefined;

  isNative = Capacitor.isNativePlatform();
  isIOS = Capacitor.getPlatform() === 'ios';
  isAndroid = Capacitor.getPlatform() === 'android';

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.initBiometry();
  }

  ngOnDestroy() {
    this.appListener?.remove();
  }

  get biometryName(): string {
    if (this.biometry.biometryTypes.length === 0) {
      return 'No biometry';
    }

    if (this.biometry.biometryTypes.length === 1) {
      return getBiometryName(this.biometry.biometryType);
    }

    return 'Biometry';
  }

  get biometryNames(): string {
    if (this.biometry.biometryTypes.length === 0) {
      return 'None';
    }

    return this.biometry.biometryTypes
      .map((type) => getBiometryName(type))
      .join('<br>');
  }

  get availableBiometry(): string {
    if (this.biometry.isAvailable) {
      return this.biometry.biometryTypes.length > 1 ? 'One or more' : 'Yes';
    } else {
      return 'None';
    }
  }

  async initBiometry() {
    this.updateBiometryInfo(await BiometricAuth.checkBiometry());

    try {
      this.appListener = await BiometricAuth.addResumeListener(
        this.updateBiometryInfo.bind(this)
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }

    await SplashScreen.hide();
  }

  updateBiometryInfo(info: CheckBiometryResult): void {
    this.biometry = info;
  }

  async showAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: `${this.biometryName} says:`,
      subHeader: '',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async showErrorAlert(error: BiometryError): Promise<void> {
    await this.showAlert(`${error.message} [${error.code}].`);
  }

  async onAuthenticate(): Promise<void> {
    try {
      const options: AuthenticateOptions = {
        reason: this.formModel.reason || '',
        cancelTitle: this.formModel.cancelTitle || '',
        iosFallbackTitle: this.formModel.iosFallbackTitle || '',
        androidTitle: this.formModel.androidTitle || '',
        androidSubtitle: this.formModel.androidSubtitle || '',
        allowDeviceCredential: this.formModel.allowDeviceCredential || false,
        androidConfirmationRequired:
          this.formModel.androidConfirmationRequired || false,
        androidBiometryStrength: this.formModel.onlyUseStrongBiometry
          ? AndroidBiometryStrength.strong
          : AndroidBiometryStrength.weak,
      };

      await BiometricAuth.authenticate(options);
      this.showAlert('Authentication Successful');
    } catch (error) {
      if (error instanceof BiometryError) {
        await this.showAlert(error.message);
      }
    }
  }

  async onSelectBiometry(event: CustomEvent): Promise<void> {
    const type = Number(event.detail.value);

    if (type > 10) {
      const primary = Math.floor(type / 10) as BiometryType;
      const secondary = (type % 10) as BiometryType;
      await BiometricAuth.setBiometryType([primary, secondary]);
    } else {
      await BiometricAuth.setBiometryType(
        type === 0 ? BiometryType.none : type
      );
    }

    this.updateBiometryInfo(await BiometricAuth.checkBiometry());
  }

  onSetAndroidBiometryStrength(): void {
    // The form value is used directly in onAuthenticate
  }

  async onSetIsEnrolled(): Promise<void> {
    await BiometricAuth.setBiometryIsEnrolled(this.formModel.isEnrolled);
    this.updateBiometryInfo(await BiometricAuth.checkBiometry());
  }

  async onSetDeviceIsSecure(): Promise<void> {
    await BiometricAuth.setDeviceIsSecure(this.formModel.deviceIsSecure);
    this.updateBiometryInfo(await BiometricAuth.checkBiometry());
  }
}
