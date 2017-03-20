using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Text;
using System.Windows.Forms;
using static sys.Global;

namespace sys {
  class TextEditor : SysForm {

    Editor editor;
    List<Control> allControls;

    private const int topHeight = 40;
    private const string openFileSetting = "Editor_openFile";

    public override void init() {
      BackColor = Color.FromArgb(0x2e, 0x2e, 0x2e);
      allControls = new List<Control>();
      Text = "Text Editor";
      setScreenSizePercentage(.75);
      editor = new Editor(backColor: BackColor) {
        Dock = DockStyle.Fill
      };
      int colorBase = 0x88;
      HorizontalPanel topPanel = new HorizontalPanel() {
        Dock = DockStyle.Top,
        Height = topHeight,
        BackColor = Color.FromArgb(colorBase, colorBase, colorBase)
      };
      topPanel.addControl(new TopButton(click: delegate {
        save(SysSettings.getSetting(openFileSetting, null));
      }, text: "Save"));
      topPanel.addControl(new TopButton(click: delegate { open(); }, text: "Open"));
      topPanel.addControl(new TopButton(click: delegate {
        SysSettings.deleteSetting(openFileSetting);
        editor.Text = string.Empty;
      }, text: "Close File"));
      this.addControl(topPanel);
      Panel editorContainer = new Panel() {
        Padding = new Padding(5),
        Dock = DockStyle.Bottom
      };
      editor.scrollEvent += delegate {
        
      };
      Action<Control> addToList = null;
      addToList = (Control c) => {
        if (c == null) return;
        allControls.Add(c);
        foreach (Control subC in c.Controls) addToList(subC);
      };
      editorContainer.addControl(editor);
      this.addControl(editorContainer);
      addToList(this);
      async(() => {
        string openFile = SysSettings.getSetting(openFileSetting, null);
        if (openFile != null) editor.runOnUiThread(() => { open(openFile); });
      });

      KeyEventHandler keyHandler = (object o, KeyEventArgs args) => {
        if (args.Control) switch (args.KeyCode) {
            case Keys.O:
              open();
              break;
            case Keys.S:
              save(SysSettings.getSetting(openFileSetting, null));
              break;
            case Keys.A:
              editor.SelectAll();
              break;
          }
      };
      KeyDown += keyHandler;
      foreach (Control c in allControls) c.KeyDown += keyHandler;
      resizeHandler = delegate {
        editorContainer.Height = ClientSize.Height - (topHeight + 10);
      };
    }

    protected void save(string filename = null) {
      if (filename == null) {
        SaveFileDialog dialog = new SaveFileDialog();
        if (dialog.ShowDialog() == DialogResult.OK) {
          using (StreamWriter writer = new StreamWriter(dialog.FileName))
            writer.Write(editor.Text);
        }
      } else using (StreamWriter writer = new StreamWriter(filename))
          writer.Write(editor.Text);
    }

    protected void open(string filename = null) {
      try {
        if (filename == null) {
          OpenFileDialog dialog = new OpenFileDialog() {
            Multiselect = false
          };
          if (dialog.ShowDialog() == DialogResult.OK && File.Exists(dialog.FileName)) {
            SysSettings.setSetting(openFileSetting, dialog.FileName);
            string cont = File.ReadAllText(dialog.FileName);
            editor.Text = cont;
            Text = Path.GetFileName(dialog.FileName);
          }
        } else {
          SysSettings.setSetting(openFileSetting, filename);
          editor.Text = File.ReadAllText(filename);
          Text = Path.GetFileName(filename);
        }
      } catch (Exception e) { handle(e); Toast.show("Problem opening file"); }
    }
    
    private class TopButton : Button {
      public TopButton(EventHandler click = null, string text = "Button") {
        init();
        Click += click;
        Text = text;
      }

      private void init() {
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        AutoSize = true;
        Margin = new Padding(0);
        Padding = new Padding(0);
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        ForeColor = Color.DarkBlue;
        TabStop = false;
        FlatAppearance.BorderColor = Color.FromArgb(0, 255, 255, 255);
      }

      GraphicsPath GetRoundPath(RectangleF Rect, int radius) {
        float r2 = radius / 2f;
        GraphicsPath GraphPath = new GraphicsPath();

        GraphPath.AddArc(Rect.X, Rect.Y, radius, radius, 180, 90);
        GraphPath.AddLine(Rect.X + r2, Rect.Y, Rect.Width - r2, Rect.Y);
        GraphPath.AddArc(Rect.X + Rect.Width - radius, Rect.Y, radius, radius, 270, 90);
        GraphPath.AddLine(Rect.Width, Rect.Y + r2, Rect.Width, Rect.Height - r2);
        GraphPath.AddArc(Rect.X + Rect.Width - radius,
                         Rect.Y + Rect.Height - radius, radius, radius, 0, 90);
        GraphPath.AddLine(Rect.Width - r2, Rect.Height, Rect.X + r2, Rect.Height);
        GraphPath.AddArc(Rect.X, Rect.Y + Rect.Height - radius, radius, radius, 90, 90);
        GraphPath.AddLine(Rect.X, Rect.Height - r2, Rect.X, Rect.Y + r2);

        GraphPath.CloseFigure();
        return GraphPath;
      }

      protected override void OnPaint(PaintEventArgs e) {
        base.OnPaint(e);
        RectangleF rect = new RectangleF(0, 0, Width, Height);
        GraphicsPath path = GetRoundPath(rect, 20);
        Region = new Region(path);
      }
    }

    public class Editor : RichTextBox {
      public Editor(Color? backColor = null) {
        Font = new Font("Hack", 12f);
        WordWrap = false;
        BackColor = backColor != null ? (Color)backColor : Color.FromArgb(0x1e, 0x1e, 0x1e);
        ForeColor = Color.White;
        BorderStyle = BorderStyle.None;
        Multiline = true;
        PreviewKeyDown += (object o, PreviewKeyDownEventArgs args) => {
          switch (args.KeyCode) {
            case Keys.Enter:
            case Keys.Tab:
              args.IsInputKey = true;
              break;
          }
        };
      }

      public int getVerticalScrollPosition() {
        int index = GetCharIndexFromPosition(new Point(1, 1));
        return GetLineFromCharIndex(index);
      }

      protected override void OnPaint(PaintEventArgs args) {
        using (Graphics graphics = args.Graphics) {
        }
      }

      private const int WM_PAINT = 0x000F;
      private const int WM_HSCROLL = 0x114;
      private const int WM_VSCROLL = 0x115;
      private const int WM_MOUSEWHEEL = 0x20A;
      protected override void WndProc(ref Message m) {
        base.WndProc(ref m);
        if (m.Msg == WM_PAINT) {
          OnPaint(new PaintEventArgs(Graphics.FromHwnd(m.HWnd), ClientRectangle));
        } else if (m.Msg == WM_HSCROLL || m.Msg == WM_MOUSEWHEEL || m.Msg == WM_VSCROLL) {
          if (scrollEvent != null) scrollEvent.Invoke(this, null);
        }
      }

      public event EventHandler scrollEvent;
    }

    public class HorizontalPanel : Panel {
      private int space;
      public HorizontalPanel(int space = 5) : base() {
        this.space = space;
        ControlAdded += (object o, ControlEventArgs args) => {
          args.Control.Font = new Font("Roboto", 10f);
          int leftMost = 0;
          foreach (Control c in Controls) {
            if (c == args.Control) continue;
            int right = c.Left + c.Width;
            if (right > leftMost) leftMost = right;
          }
          args.Control.Left = leftMost + space;
          args.Control.Top = space;
        };
      }
    }
  }
}
