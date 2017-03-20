using System.Collections.Generic;
using System.Net.NetworkInformation;
using System.Text;
using System.Windows.Forms;

namespace sys {
  public class InfoForm : SysForm {
    public override void init() {
      setScreenSizePercentage(.75);
      Text = "System Info";
      resizeHandler = delegate {

      };
      networkLabel = new Label();
      networkLabel.AutoSize = true;
      this.addControl(networkLabel);
      nicArr = NetworkInterface.GetAllNetworkInterfaces();
      uploadArr = new List<double>(nicArr.Length);
      downloadArr = new List<double>(nicArr.Length);
      for (int i = 0; i < nicArr.Length; i++) {
        uploadArr.Add(0);
        downloadArr.Add(0);
      }
      timer = new Timer();
      timer.Interval = (int)timerUpdate;
      timer.Tick += delegate {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < nicArr.Length; i++) {
          NetworkInterface nic = nicArr[i];
          if (nic.Name.Contains("Bluetooth") || nic.Name.Contains("{")) continue;
          IPv4InterfaceStatistics stats = nic.GetIPv4Statistics();
          int upSpeed = (int)(stats.BytesSent - uploadArr[i]) / 1024;
          int downSpeed = (int)(stats.BytesReceived - downloadArr[i]) / 1024;
          sb.AppendLine(string.Format("{0} - Upload: {1} {2}/s Download: Upload: {3} {4}/s",
            nic.Name,
            upSpeed > 1024 ? upSpeed / 1024 : upSpeed, upSpeed > 1024 ? "MB" : "KB",
            downSpeed > 1024 ? downSpeed / 1024 : downSpeed, downSpeed > 1024 ? "MB" : "KB"));
          uploadArr[i] = stats.BytesSent;
          downloadArr[i] = stats.BytesReceived;
        }
        networkLabel.runOnUiThread(() => { networkLabel.Text = sb.ToString(); });
      };
      timer.Start();
      FormClosing += delegate { timer.Dispose(); };
      setFont();
    }

    private const double timerUpdate = 1000;
    private NetworkInterface[] nicArr;
    private List<double> uploadArr, downloadArr;
    private Timer timer;

    long getNetworkSpeed() {
      long val = 0;
      foreach (NetworkInterface adapter in NetworkInterface.GetAllNetworkInterfaces())
        if (adapter.Speed > val) val = adapter.Speed;
      return val;
    }
    Label networkLabel;
  }
}
