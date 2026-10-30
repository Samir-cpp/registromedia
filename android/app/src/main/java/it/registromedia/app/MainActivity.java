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
 private static final int OPEN_FILE=10,SAVE_FILE=11;
 private WebView web;
 private ValueCallback<Uri[]> chooser;
 private String pendingBackup;
 private final Set<String> files=new java.util.HashSet<>(java.util.Arrays.asList("index.html","style.css","app.mjs","model.mjs","vault.mjs","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","theme.js"));
 private boolean allowed(Uri u){return "https".equals(u.getScheme())&&"appassets.androidplatform.net".equals(u.getHost())&&u.getPort()==-1&&u.getUserInfo()==null&&u.getPath()!=null&&u.getPath().startsWith("/assets/")&&files.contains(u.getPath().substring(8));}
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);
  // Keep controls below Android system bars, including edge-to-edge Android 15.
  web.setOnApplyWindowInsetsListener((v,insets)->{if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}else{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());}return insets;});
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setUserAgentString(s.getUserAgentString()+" RegistroMediaAndroid/1.0.0");s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setSafeBrowsingEnabled(true);s.setSupportMultipleWindows(true);s.setJavaScriptCanOpenWindowsAutomatically(false);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){Uri u=request.getUrl();if(!allowed(u))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));WebResourceResponse r=loader.shouldInterceptRequest(u);if(r!=null){if(u.getPath().endsWith(".mjs")||u.getPath().endsWith(".js"))r.setMimeType("text/javascript");java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("Content-Security-Policy","default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");headers.put("Referrer-Policy","no-referrer");r.setResponseHeaders(headers);}return r;}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){String url=request.getUrl().toString();return !allowed(request.getUrl());}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);try{startActivityForResult(intent,OPEN_FILE);}catch(Exception e){chooser.onReceiveValue(null);chooser=null;}return true;}
   @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){return false;}
  });
  if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))WebViewCompat.addWebMessageListener(web,"NativeBackup",Collections.singleton(ORIGIN),(view,message,source,isMainFrame,reply)->{if(!isMainFrame||!("https".equals(source.getScheme())&&"appassets.androidplatform.net".equals(source.getHost())&&source.getPort()==-1))return;String payload=message.getData();if(payload==null||payload.length()>5000000||pendingBackup!=null)return;try{JSONObject json=new JSONObject(payload);if(!"registromedia-encrypted".equals(json.optString("format"))||json.optInt("version")!=3||!json.getJSONObject("account").has("ciphertext"))return;pendingBackup=payload;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_TITLE,"registromedia-cifrato.json");startActivityForResult(intent,SAVE_FILE);}catch(Exception e){pendingBackup=null;Toast.makeText(this,"Backup non esportato",Toast.LENGTH_LONG).show();}});
  if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))WebViewCompat.addWebMessageListener(web,"NativeAppearance",Collections.singleton(ORIGIN),(view,message,source,isMainFrame,reply)->{if(!isMainFrame||!"https".equals(source.getScheme())||!"appassets.androidplatform.net".equals(source.getHost())||source.getPort()!=-1)return;String mode=message.getData();if(!"dark".equals(mode)&&!"light".equals(mode))return;boolean dark="dark".equals(mode);getWindow().setStatusBarColor(android.graphics.Color.parseColor(dark?"#12161e":"#f5f6f8"));getWindow().setNavigationBarColor(android.graphics.Color.parseColor(dark?"#12161e":"#f5f6f8"));int flags=getWindow().getDecorView().getSystemUiVisibility();int lightFlags=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;getWindow().getDecorView().setSystemUiVisibility(dark?flags&~lightFlags:flags|lightFlags);});
  web.loadUrl(ORIGIN+"/assets/index.html");
 }
 @Override protected void onActivityResult(int request,int result,Intent intent){super.onActivityResult(request,result,intent);if(request==OPEN_FILE&&chooser!=null){Uri[] chosen=null;if(result==RESULT_OK&&intent!=null){if(intent.getClipData()!=null){int n=intent.getClipData().getItemCount();chosen=new Uri[n];for(int i=0;i<n;i++)chosen[i]=intent.getClipData().getItemAt(i).getUri();}else if(intent.getData()!=null)chosen=new Uri[]{intent.getData()};}chooser.onReceiveValue(chosen);chooser=null;}if(request==SAVE_FILE){String payload=pendingBackup;pendingBackup=null;if(result==RESULT_OK&&intent!=null&&payload!=null){try(OutputStream out=getContentResolver().openOutputStream(intent.getData())){if(out==null)throw new java.io.IOException();out.write(payload.getBytes(StandardCharsets.UTF_8));Toast.makeText(this,"Backup cifrato salvato",Toast.LENGTH_LONG).show();}catch(Exception e){Toast.makeText(this,"Salvataggio non riuscito",Toast.LENGTH_LONG).show();}}}}
 @Override public void onBackPressed(){web.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');if(d){d.close();return true;}return false;})()",result->{if(!"true".equals(result))moveTaskToBack(true);});}
 @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);pendingBackup=null;if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
