import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController, NavController, ToastController, ModalController } from '@ionic/angular';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { Router } from '@angular/router';
import { TranslateConfigService } from '../../services/translate-config.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserDataService } from '../../services/user-data.service';
import { Roles } from 'models/enums/roles.enum';
import { Profile } from 'models/class/profile';
import { PositionPikerComponent } from 'modules/position-piker/position-piker.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {

  // Binding
  public Page = {
    help: Roles
  }

  public showInfo = true;
  public profile: Profile;
  public hasProfile = false;

  constructor(
    private readonly loadingCtrl: LoadingController,
    private readonly userDataService: UserDataService,
    private readonly profileService: ProfileService,
    private readonly translateConfigService: TranslateConfigService,
    private readonly navCtrl: NavController,
    private readonly router: Router,
    private readonly toast: ToastController,
    private readonly modalController: ModalController
  ) {
    this.translateConfigService.getDefaultLanguage();
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {

  }


  ionViewDidEnter() {
    this.onEnter();
  }

  async onEnter() {
    const loading = await this.loadingCtrl.create();
    loading.present();

    this.showInfo = true;
    this.getProrile()

    await loading.dismiss();
  }


  public onClickHideInfo() {
    const p = this.profile.position;
    if (p && p.lat && p.lat != 0 && p.lng && p.lng != 0) {
      this.showInfo = false;

    } else {
      const message = this.translateConfigService.translateInstant('PROFILE_PAGE.SET_POSITION_MESSAGE');
      this.showToast(message);
    }
  }

  public async saveProfile() {

    const loading = await this.loadingCtrl.create();

    await loading.present();
    await this.profileService.addProfile(this.profile).toPromise()
    await loading.dismiss();

    this.navCtrl.navigateRoot('home/tabs/map');
  }

  async showModalPosiont() {
    const modal = await this.modalController.create({
      component: PositionPikerComponent,
      componentProps: {
        'profile': this.profile
      },
      swipeToClose: true,
      showBackdrop: true,
    });
    modal.present();
    const detail = await modal.onDidDismiss();
    this.profile = detail.data.profile;
  }

  public toggleCapability(role: Roles) {
    const val = !this.getCapability(role);
    this.profileService.setCapability(this.profile, role, val);
  }
  public getCapability(role: Roles) {
    return this.profileService.getCapability(this.profile, role);
  }

  public getCapabilityClass(role: Roles) {
    return this.getCapability(role) ? 'cap-enabled' : '';
  }

  public getAvaibleClass() {
    return this.profile.isAvailable ? 'cap-enabled' : '';
  }

  public toggleIsAvaible() {
    this.profile.isAvailable = !this.profile.isAvailable
    if (this.profile.isAvailable) {
      this.profile.isHelper = true;
    }
  }

  // ------------- PRIVATE METHODS --------------//
  // --------------------------------------------//

  private getProrile() {
    return this.profileService.getProfile()
      .pipe(
        switchMap(profile => this.getProfileSwitchMap(profile)),
        untilDestroyed(this)
      )
      .subscribe({
        next: profile => this.profile = profile
      });
  }

  private getProfileSwitchMap(profile: Profile) {
    if (profile) {
      this.hasProfile = true;
      return of(profile);
    } else {
      return this.userDataService.getUser().pipe(map(user => {
        this.hasProfile = false;
        profile = new Profile();
        this.profileService.setProfileByUser(profile, user);
        return profile;
      }));
    }
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({ message: message })
    t.present();
    setTimeout(() => {
      t.dismiss();
    }, 2000);
  }

}


