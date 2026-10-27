package it.registromedia.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.Toast;
import android.view.WindowInsets;
import android.view.View;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.Collections;

public class MainActivity extends Activity {
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private static final String ARGO="https://www.portaleargo.it/famiglia/";
 private static final int OPEN_FILE=10,SAVE_FILE=11;
 private WebView web;
 private ValueCallback<Uri[]> chooser;
 private String pendingBackup;
 private final Set<String> files=new java.util.HashSet<>(java.util.Arrays.asList("index.html","style.css","app.mjs","model.mjs","vault.mjs","argo.mjs","manifest.json","icon.svg"));
 private void openArgo(String url){if(!ARGO.equals(url))return;try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(ARGO)));}catch(Exception e){Toast.makeText(this,"Nessun browser disponibile",Toast.LENGTH_LONG).show();}}
 private boolean allowed(Uri u){if(u.getPath()==null)return false;return "https".equals(u.getScheme())&&"appassets.androidplatform.net".equals(u.getHost())&&u.getPort()==-1&&u.getUserInfo()==null&&files.contains(u.getPath().replaceFirst("^/assets/",""))&&u.getPath().startsWith("/assets/");}
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);
  // Keep controls below Android system bars, including edge-to-edge Android 15.
  web.setOnApplyWindowInsetsListener((v,insets)->{if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}else{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());}return insets;});
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setUserAgentString(s.getUserAgentString()+" RegistroMediaAndroid/0.3.0");s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setSafeBrowsingEnabled(true);s.setSupportMultipleWindows(true);s.setJavaScriptCanOpenWindowsAutomatically(false);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){Uri u=request.getUrl();if(!allowed(u))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));WebResourceResponse r=loader.shouldInterceptRequest(u);if(r!=null){if(u.getPath().endsWith(".mjs"))r.setMimeType("text/javascript");java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");headers.put("Referrer-Policy","no-referrer");r.setResponseHeaders(headers);}return r;}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){String url=request.getUrl().toString();if(ARGO.equals(url)){openArgo(url);return true;}return !allowed(request.getUrl());}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");try{startActivityForResult(intent,OPEN_FILE);}catch(Exception e){chooser.onReceiveValue(null);chooser=null;}return true;}
   @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){if(!gesture)return false;WebView child=new WebView(MainActivity.this);child.setWebViewClient(new WebViewClient(){private boolean handled=false;private void handle(String u){if(handled)return;handled=true;openArgo(u);child.stopLoading();child.destroy();}@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){handle(r.getUrl().toString());return true;}@Override public void onPageStarted(WebView v,String url,android.graphics.Bitmap favicon){handle(url);}});((WebView.WebViewTransport)message.obj).setWebView(child);message.sendToTarget();return true;}
  });
  if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))WebViewCompat.addWebMessageListener(web,"NativeBackup",Collections.singleton(ORIGIN),(view,message,source,isMainFrame,reply)->{if(!isMainFrame||!("https".equals(source.getScheme())&&"appassets.androidplatform.net".equals(source.getHost())&&source.getPort()==-1))return;String payload=message.getData();if(payload==null||payload.length()>5000000||pendingBackup!=null)return;try{JSONObject json=new JSONObject(payload);if(!"registromedia-encrypted".equals(json.optString("format"))||json.optInt("version")!=3||!json.getJSONObject("account").has("ciphertext"))return;pendingBackup=payload;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_TITLE,"registromedia-cifrato.json");startActivityForResult(intent,SAVE_FILE);}catch(Exception e){pendingBackup=null;Toast.makeText(this,"Backup non esportato",Toast.LENGTH_LONG).show();}});
  web.loadUrl(ORIGIN+"/assets/index.html");
 }
 @Override protected void onActivityResult(int request,int result,Intent intent){super.onActivityResult(request,result,intent);if(request==OPEN_FILE&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&intent!=null?new Uri[]{intent.getData()}:null);chooser=null;}if(request==SAVE_FILE){String payload=pendingBackup;pendingBackup=null;if(result==RESULT_OK&&intent!=null&&payload!=null){try(OutputStream out=getContentResolver().openOutputStream(intent.getData())){if(out==null)throw new java.io.IOException();out.write(payload.getBytes(StandardCharsets.UTF_8));Toast.makeText(this,"Backup cifrato salvato",Toast.LENGTH_LONG).show();}catch(Exception e){Toast.makeText(this,"Salvataggio non riuscito",Toast.LENGTH_LONG).show();}}}}
 @Override public void onBackPressed(){web.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');if(d){d.close();return true;}return false;})()",result->{if(!"true".equals(result))moveTaskToBack(true);});}
 @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);pendingBackup=null;if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
