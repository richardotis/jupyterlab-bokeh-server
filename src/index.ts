import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { InstanceTracker } from '@jupyterlab/apputils';

import { BokehDashboard, BokehDashboardLauncher, IDashboardItem } from './dashboard';

import '../style/index.css';

const COMMAND_ID = 'bokeh-server:launch-document';

/**
 * Initialization data for the jupyterlab-bokeh-server extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-bokeh-server',
  autoStart: true,
  requires: [ILabShell],
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    labShell: ILabShell,
    restorer: ILayoutRestorer | null
  ) => {

    const sidebar = new BokehDashboardLauncher({
      launchItem: (item: IDashboardItem) => {
        app.commands.execute(COMMAND_ID, item);
      }
    });
    sidebar.id = 'bokeh-dashboard-launcher';
    sidebar.title.iconClass ='bokeh-ChartIcon jp-SideBar-tabIcon';
    sidebar.title.caption = 'My Cool Plots';
    labShell.add(sidebar, 'left');

    // An instance tracker which is used for state restoration.
    const tracker = new InstanceTracker<BokehDashboard>({
      namespace: 'bokeh-dashboard-launcher'
    });

    app.commands.addCommand(COMMAND_ID, {
      label: 'Open Bokeh document',
      execute: args => {
        const item = args as IDashboardItem;
        // If we already have a dashboard open to this url, activate it
        // but don't create a duplicate.
        const w = tracker.find(w => {
          return !!(w && w.item && w.item.route === item.route);
        });
        if (w) {
          labShell.activateById(w.id);
          return;
        }

        const widget = new BokehDashboard();
        widget.title.label = item.label;
        widget.item = item;
        labShell.add(widget, 'main');
        tracker.add(widget);
      }
    });

    if (restorer) {
      // Add state restoration for the dashboard items.
      restorer.add(sidebar, sidebar.id);
      restorer.restore(tracker, {
        command: COMMAND_ID,
        args: widget => widget.item,
        name: widget => widget.item && widget.item.route
      });
    }

    labShell.add(sidebar, 'left', { rank: 200 });

  }
};

export default extension;
