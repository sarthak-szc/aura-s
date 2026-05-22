"use client"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { processAPI } from "@/lib/api"

export default function FileUpload({ processId, onDone }: { processId: string; onDone: (activities: unknown[]) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done">("idle")

  const onDrop = useCallback(async (files: File[]) => {
    setStatus("uploading")
    const form = new FormData()
    form.append("file", files[0])
    await processAPI.uploadActivityFile(processId, form)
    setStatus("processing")

    const poll = setInterval(async () => {
      const s = await processAPI.activityStatus(processId)
      if (s.data.status === "done" || (s.data.activities?.length ?? 0) > 0) {
        clearInterval(poll)
        setStatus("done")
        onDone(s.data.activities)
      }
    }, 3000)
  }, [processId, onDone])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
      ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"}`}
    >
      <input {...getInputProps()} />
      {status === "idle" && <p className="text-slate-500">Drag & drop PDF, CSV, or Excel file here</p>}
      {status === "uploading" && <p className="text-blue-600">Uploading...</p>}
      {status === "processing" && <p className="text-orange-500">AI is extracting activities...</p>}
      {status === "done" && <p className="text-green-600">Done</p>}
    </div>
  )
}
