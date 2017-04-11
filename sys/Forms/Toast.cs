using System;
using System.ComponentModel;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;

namespace sys {
  public class Toast : Form {
    public static void show(string message, int timeout = 2000, Color? backgroundColor = null, bool animate = true, Action click = null) {
      if (backgroundColor == null) backgroundColor = Color.FromArgb(0x22, 0x22, 0x22);
      new Toast(message, timeout, (Color)backgroundColor, animate: animate, click: click).Show();
    }

    private Toast(string message, int timeout, Color backgroundColor, bool animate, Action click) {
      components = new Container();
      AutoScaleMode = AutoScaleMode.Font;
      FormBorderStyle = FormBorderStyle.None;
      ShowIcon = false;
      ShowInTaskbar = false;
      Height = 100;
      Width = 200;
      BackColor = backgroundColor;
      if (backgroundColor.isDark()) ForeColor = Color.White;
      else ForeColor = Color.Black;
      Rectangle screenSize = getScreenSize();
      l = new Label();
      Left = screenSize.Width;
      l.Left = 20;
      l.Top = 20;
      l.AutoSize = true;
      l.AutoEllipsis = false;
      Controls.Add(l);
      Cursor = Cursors.Hand;
      TopMost = true;
      l.Text = message;
      bool open = true;
      try { l.Font = new Font("Hack", 12.5f); } catch { }
      Shown += delegate {
        Height = l.Height + 40;
        if (l.Width > screenSize.Width / 3)
          l.Font = new Font(l.Font.Name, 10f);
        Width = l.Width + 40;
        Top = screenSize.Height - (Height + 10);
        Left = screenSize.Width;
        System.Windows.Forms.Timer t = new System.Windows.Forms.Timer();
        t.Interval = timeout;
        t.Tick += delegate {
          open = false;
          Close();
          t.Dispose();
        };
        t.Start();
        async(() => {
          try {
            if (animate) {
              int inc = 100;
              for (int i = 0; i < inc; i++) {
                Thread.Sleep((int)(5 * (double)i / inc));
                if (!open) return;
                this.runOnUiThread(() => { Left = screenSize.Width - (int)((Width + 10) * ((double)i / inc)); });
              }
            } else this.runOnUiThread(() => { Left = screenSize.Width - (Width + 10); });
          } catch { }
        });
      };
      EventHandler onClick = delegate {
        Close();
        open = false;
        if (click != null) {
          try { click.Invoke(); } catch (Exception e) {
            Console.WriteLine(e.Message);
          }
        }
      };
      Click += onClick;
      foreach (Control c in Controls) c.Click += onClick;
    }
    Label l;

    protected Rectangle getScreenSize() {
      return Screen.FromControl(this).WorkingArea;
    }

    protected void async(Action runnable) {
      new Thread(new ThreadStart(runnable)).Start();
    }

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
}
