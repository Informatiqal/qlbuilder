import { Spinner } from "cli-spinner";

export class Spin {
  private spinnerStrings = {
    hamburger: "☱☲☴☲",
    circle: "◐◓◑◒",
    arc: "◜◠◝◞◡◟",
  };
  private spinner: Spinner;
  constructor(text: string, icon: "hamburger" | "circle" | "arc") {
    Spinner.setDefaultSpinnerDelay(200);
    this.spinner = new Spinner(text);
    this.spinner.setSpinnerString(this.spinnerStrings[icon]);
  }

  start() {
    this.spinner.start();
  }

  stop() {
    this.spinner.stop();
  }
}
