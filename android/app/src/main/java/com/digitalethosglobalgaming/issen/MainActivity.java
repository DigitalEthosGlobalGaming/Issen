package com.digitalethosglobalgaming.issen;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null) {
                    fallback();
                    return;
                }
                getBridge().getWebView().evaluateJavascript(
                    "Boolean(document.querySelector('#options.on:not([hidden])'))",
                    active -> {
                        if ("true".equals(active)) {
                            getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new Event('issen:back'))", null);
                        } else {
                            fallback();
                        }
                    });
            }
            private void fallback() {
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }
}
