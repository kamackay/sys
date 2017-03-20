using System;
using System.ComponentModel;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;

namespace sys {
  class MessageForm : Form {
    public MessageForm(string message = "", string title = "System", int timeout = 2500) {
      components = new Container();
      AutoScaleMode = AutoScaleMode.Font;
      Icon = Properties.Resources.icon;
      System.Windows.Forms.Timer t = new System.Windows.Forms.Timer();
      t.Tick += delegate {
        Close();
        t.Dispose();
      };
      t.Interval = timeout;
      t.Start();
      l = new Label();
      l.Left = 50;
      l.Top = 50;
      l.AutoSize = true;
      l.AutoEllipsis = false;
      Controls.Add(l);
      try {
        l.Font = new Font("Hack", 15f);
      } catch { }
      l.Text = message;
      Text = title;
      new Thread(new ThreadStart(() => {
        Thread.Sleep(10);
        Invoke((Action)(() => {
          Width = l.Width + 100;
          Height = l.Height + 150;
          center();
        }));
      })).Start();
    }

    Label l;

    void center() {
      Rectangle screenSize = getScreenSize();
      Left = (screenSize.Width - Width) / 2;
      Top = (screenSize.Height - Height) / 2;
    }

    protected Rectangle getScreenSize() {
      return Screen.FromControl(this).Bounds;
    }

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
}
