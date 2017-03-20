using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Windows.Forms;
using static sys.Global.SysSettings;

namespace sys {
  class SettingsForm : SysForm {

    public override void init() {
      Text = "Sys Manager Settings";
      setSetting(lastOpened, string.Format("{0}", Stopwatch.GetTimestamp()));
      setScreenSizePercentage(.75);
      scrollPanel = new Panel() {
        Dock = DockStyle.Top,
        AutoScroll = true,
        Padding = new Padding(10)
      };
      scrollPanel.ControlAdded += (object o, ControlEventArgs args) => {
        try {
          int max = 0;
          foreach (Control c in ((Control)o).Controls) {
            if (c == args.Control) continue;
            int bottom = c.Top + c.Height;
            if (bottom > max) max = bottom;
          }
          args.Control.Top = max;
        } catch { }
      };
      settingsList = new List<SettingView>();
      Panel bottomPanel = new Panel() { Dock = DockStyle.Bottom };
      this.addControl(bottomPanel);
      Button saveButton = new Button() {
        Dock = DockStyle.Right,
        Text = "Save"
      };
      saveButton.MouseClick += (object o, MouseEventArgs args) => {
        if (args.Button == MouseButtons.Left) {
          try {
            foreach (SettingView setting in settingsList) {
              setSetting(setting.settingName.Text, setting.settingValue.Text);
            }
          } catch (Exception e) { handle(e); }
        }
      };
      Button reloadButton = new Button() {
        Dock = DockStyle.Left,
        Text = "Reload"
      };
      reloadButton.MouseClick += (object o, MouseEventArgs args) => {
        if (args.Button == MouseButtons.Left) {
          loadSettings();
        }
      };

      this.addControl(scrollPanel);
      bottomPanel.Controls.Add(saveButton);
      bottomPanel.Controls.Add(reloadButton);
      resizeHandler = delegate {
        int halfWidth = (Width / 2) - 1;
        scrollPanel.Height = 9 * Height / 10;
        foreach (Control c in scrollPanel.Controls) c.Width = scrollPanel.Width - 10;
        bottomPanel.Height = Math.Max(saveButton.Font.Height + 50, Height / 10);
        saveButton.Width = halfWidth;
        reloadButton.Width = halfWidth;
      };
      loadSettings();
      setFont();
    }

    Panel scrollPanel;
    List<SettingView> settingsList;

    public void loadSettings() {
      try {
        scrollPanel.Controls.Clear();
        using (RegistryKey key = getSettingsKey()) {
          foreach (string valueName in key.GetValueNames()) {
            if (valueName.Equals(lastOpened)) continue;
            SettingView view = new SettingView(valueName, getSetting(valueName, null)) {
              Height = 50, Width = scrollPanel.Width - 10
            };
            settingsList.Add(view);
            scrollPanel.addControl(view);
          }
        }
      } catch (Exception e) { handle(e); }
    }

    private class SettingView : Control {
      public TextBox settingName;
      public TextBox settingValue;
      public SettingView(string settingName, string settingValue = "") {
        this.settingName = new TextBox() {
          ReadOnly = true,
          Text = settingName,
          Left = 0
        };
        this.settingValue = new TextBox() {
          Text = settingValue
        };
        Controls.Add(this.settingName);
        Controls.Add(this.settingValue);
        EventHandler resizeDel = (object o, EventArgs args) => {
          int halfWidth = Width / 2;
          this.settingName.Width = halfWidth;
          this.settingValue.Left = halfWidth;
          this.settingValue.Width = halfWidth;
          Height = Math.Max(this.settingName.Height, this.settingValue.Height) + 10;
        };
        Resize += resizeDel;
        resizeDel.Invoke(null, null);
      }
    }
  }
}
