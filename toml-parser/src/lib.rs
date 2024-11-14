use wasm_bindgen::prelude::*;
use toml::de::from_str;
use serde_json::json;
use std::collections::HashMap;

#[wasm_bindgen]
pub fn parse_toml(toml_str: &str) -> Result<String, String> {
    let parsed: Result<HashMap<String, toml::Value>, toml::de::Error> = from_str(toml_str);
    
    match parsed {
        Ok(data) => {
            let json_data = serde_json::to_string(&data).map_err(|e| e.to_string())?;
            Ok(json_data)
        },
        Err(err) => Err(format!("Error parsing TOML: {}", err)),
    }
}
