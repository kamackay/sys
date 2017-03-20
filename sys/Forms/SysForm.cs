using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;

namespace sys {
  public abstract class SysForm : Form {

    public SysForm() {
      components = new Container();
      AutoScaleMode = AutoScaleMode.Font;
      Icon = Properties.Resources.icon;
      EventHandler resize = delegate (object o, EventArgs args) {

        if (resizeHandler != null) resizeHandler.Invoke(o, args);
      };
      Resize += resize;
      async(() => {
        // Give the Whole GUI .1 second to get to the proper size and everything, then update the sizes of some of the controls
        Thread.Sleep(100);
        this.runOnUiThread(() => { resize.Invoke(this, null); });
      });
      init();
    }

    protected void setScreenSizePercentage(double percentage) {
      Rectangle screenSize = getScreenSize();
      double offset = (1 - percentage) / 2;
      Width = (int)(percentage * screenSize.Width);
      Height = (int)(percentage * screenSize.Height);
      Top = (int)(offset * screenSize.Height);
      Left = (int)(offset * screenSize.Width);
    }

    protected Rectangle getScreenSize() {
      return Screen.FromControl(this).Bounds;
    }

    public void setFont(Font f = null) {
      if (f == null) f = new Font("Hack", 12.5f);
      foreach (Control c in Controls) c.Font = f;
    }

    protected void handle(Exception e) {
      Debug.WriteLine(e.Message);
    }

    protected void sleep(int ms) { Thread.Sleep(ms); }

    protected void async(Action runnable) {
      new Thread(new ThreadStart(runnable)).Start();
    }

    public void show() { Show(); }

    public abstract void init();

    protected EventHandler resizeHandler = null;

    /// <summary>
    /// Required designer variable.
    /// </summary>
    protected IContainer components = null;

    /// <summary>
    /// Clean up any resources being used.
    /// </summary>
    /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
    protected override void Dispose(bool disposing) {
      if (disposing && (components != null)) components.Dispose();
      base.Dispose(disposing);
    }
  }

  public static class Overrides {
    public static void runOnUiThread(this Control control, Action runnable) {
      try {
        control.Invoke(runnable);
      } catch (Exception e) {
        Debug.WriteLine(e.Message);
      }
    }

    public static void setLocation(this Control c, int x = 0, int y = 0) {
      c.runOnUiThread(() => { c.Location = new Point(x, y); });
    }

    public static void addControl(this Control c, Control newC) {
      c.Controls.Add(newC);
    }
  }
}
