import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { PiCloudArrowUp as PiCloudArrowUpIcon } from "react-icons/pi";
import { AiOutlineDelete } from "react-icons/ai";

const DropzoneMulti = ({ field, form: { setFieldValue }, ...props }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [localError, setLocalError] = useState("");

  const handleDeleteFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    setFieldValue(field.name, newFiles);
  };

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    onDrop: async (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const rejectedTypes = fileRejections.some(rej => rej.errors.some(err => err.code === 'file-invalid-type'));
        if (rejectedTypes) {
          setLocalError("Tipo de archivo no permitido. Solo se aceptan PDF, Word, Excel, JPG, PNG, TXT y CSV.");
        } else {
          setLocalError("Algunos archivos fueron rechazados (límite de 5 archivos, 10MB por archivo en total).");
        }
        return;
      }

      setLocalError("");
      let currentFiles = [...selectedFiles];
      
      for (const file of acceptedFiles) {
        if (currentFiles.length >= 5) break;
        try {
          const buffer = await file.arrayBuffer();
          currentFiles.push({
            originalname: file.name,
            buffer: buffer,
          });
        } catch (error) {
          console.error(error);
        }
      }

      // Check total size
      const totalSize = currentFiles.reduce((acc, curr) => acc + (curr.buffer.byteLength || 0), 0);
      if (totalSize > 10 * 1024 * 1024) {
        setLocalError("El tamaño total de los archivos supera los 10MB.");
      } else {
        setSelectedFiles(currentFiles);
        setFieldValue(field.name, currentFiles);
        setLocalError("");
      }
    },
  });

  return (
    <div>
      <div {...getRootProps()} className='dropzone' style={{ padding: '20px', cursor: 'pointer', border: '2px dashed var(--primary-color)' }}>
        <PiCloudArrowUpIcon size={32} />
        <h3>Importá acá tus archivos</h3>
        <input {...getInputProps()} />
        <p>Arrastrá o hacé click para seleccionar (Máximo 5 archivos, hasta 10MB en total. Formatos: PDF, Word, Excel, JPG, PNG, TXT, CSV)</p>
      </div>
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4>Archivos seleccionados:</h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {selectedFiles.map((f, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px', borderBottom: '1px solid #ccc' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{f.originalname}</span>
                <AiOutlineDelete style={{ cursor: 'pointer', color: 'red' }} onClick={() => handleDeleteFile(index)} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {localError && <div className="error-message" style={{ marginTop: '8px' }}>{localError}</div>}
    </div>
  );
};

export default DropzoneMulti;
