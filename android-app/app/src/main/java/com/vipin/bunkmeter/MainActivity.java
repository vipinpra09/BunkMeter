package com.vipin.bunkmeter;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String HOME_URL = "https://vipinpra09.github.io/BunkMeter/?page=calculator";
    private static final String APP_STYLE = "var s=document.createElement('style');s.textContent=" +
        "'body.calculator-page{background:#f5f7fc!important}' +" +
        "'body.calculator-page .topbar,body.calculator-page .footer,body.calculator-page .back-home,body.calculator-page .pill{display:none!important}' +" +
        "'body.calculator-page main{max-width:900px;margin:0 auto;padding:18px 14px 32px!important}' +" +
        "'body.calculator-page #calculator{padding-top:0!important}' +" +
        "'body.calculator-page .section-heading{font-size:25px;letter-spacing:-.6px;margin:8px 0}' +" +
        "'body.calculator-page .section-description{font-size:14px;line-height:1.5;margin-bottom:18px}' +" +
        "'body.calculator-page .hero{border-radius:22px;box-shadow:0 8px 26px #152c5010}' +" +
        "'body.calculator-page .card{border-radius:20px;box-shadow:0 6px 22px #152c500c;border:1px solid #e7ebf4;overflow:hidden}' +" +
        "'body.calculator-page input{min-height:48px;font-size:16px;border-radius:12px}' +" +
        "'body.calculator-page button{min-height:44px;border-radius:12px;touch-action:manipulation}' +" +
        "'body.calculator-page .primary{width:100%;font-weight:700}' +" +
        "'body.calculator-page .results{padding:18px}' +" +
        "'body.calculator-page .trend-card{border-radius:16px;overflow:hidden}' +" +
        "'@media(max-width:480px){body.calculator-page main{padding:12px 10px 28px!important}body.calculator-page .hero{padding:18px}body.calculator-page .section-heading{font-size:23px}body.calculator-page .big-number{font-size:42px}}';document.head.appendChild(s);";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(245, 247, 252));
        getWindow().setNavigationBarColor(Color.rgb(245, 247, 252));
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        );

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(245, 247, 252));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(APP_STYLE, null);
            }
        });
        setContentView(webView);

        if (savedInstanceState != null && webView.restoreState(savedInstanceState) != null) {
            // Restored the previous calculator page.
        } else {
            webView.loadUrl(HOME_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
