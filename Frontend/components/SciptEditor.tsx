"use client";
import Editor from "@monaco-editor/react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function DeployScriptEditor({ value, onChange }: Props) {
  return (
    <Editor
      height="200px"
      language="shell"
      theme="vs-dark"
      value={value}
      onChange={(val) => onChange(val ?? "")}
      path="deploy-script"
      
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
      }}
    />
  );
}