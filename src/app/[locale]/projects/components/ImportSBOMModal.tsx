// Copyright (C) Siemens AG, 2023. Part of the SW360 Frontend Project.

// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/

// SPDX-License-Identifier: EPL-2.0
// License-Filename: LICENSE

'use client'

import { getSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { useRef, useState } from 'react'
import { Alert, Modal } from 'react-bootstrap'

import { HttpStatus } from '@/object-types'
import { ApiUtils } from '@/utils'
import styles from '../projects.module.css'

interface Props {
    importSBOMMetadata: ImportSBOMMetadata
    setImportSBOMMetadata: React.Dispatch<React.SetStateAction<ImportSBOMMetadata>>
}

enum ImportSBOMState {
    INIT_STATE,
    CONFIRM_IMPORT,
    IMPORTING,
    IMPORTED
}

interface AlertData {
    message: JSX.Element
    variant: string
}

interface ImportSBOMMetadata {
    importType: 'SPDX' | 'CycloneDx'
    show: boolean
}

const ImportSBOMModal = ({ importSBOMMetadata, setImportSBOMMetadata }: Props) => {
    const t = useTranslations('default')
    const [importState, setImportState] = useState(ImportSBOMState.INIT_STATE)
    const [fileFormatError, setFileFormatError] = useState<AlertData | null>(null)
    const [importError, setImportError] = useState<AlertData | null>(null)
    const selectedFile = useRef<File | undefined>(undefined)
    const inputRef = useRef<HTMLInputElement>(undefined)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        selectedFile.current = e.currentTarget.files[0]
        if (!selectedFile || !selectedFile.current) {
            return
        }
        if (importSBOMMetadata.importType === 'SPDX') {
            if (!selectedFile.current.name.endsWith('.rdf') && !selectedFile.current.name.endsWith('.xml')) {
                setFileFormatError({ variant: 'danger', message: <p>
                    {
                        selectedFile.current ?
                        t.rich('SBOM_IMPORT_FILE_FORMAT_ERROR', {
                            fileName: selectedFile.current.name,
                            files: '.rdf, .xml'
                        }): ''
                    }
                </p>})
                return
            }
        } else {
            if (!selectedFile.current.name.endsWith('.json') && !selectedFile.current.name.endsWith('.xml')) {
                setFileFormatError({ variant: 'danger', message: <p>
                    {
                        selectedFile.current ? 
                        t.rich('SBOM_IMPORT_FILE_FORMAT_ERROR', {
                            fileName: selectedFile.current.name,
                            files: '.json, .xml'
                        }): ''
                    }
                </p>})
                return
            }
        }
        setImportState(ImportSBOMState.CONFIRM_IMPORT)
    }

    const importFile = async () => {
        try {
            const formData = new FormData()
            formData.append('file', selectedFile.current, selectedFile.current.name)
            const session = await getSession()
            const response = await ApiUtils.POST(
                `projects/import/SBOM?type=${importSBOMMetadata.importType}`,
                formData,
                session.user.access_token
            )
            if (response.status === HttpStatus.OK) {
                setImportError({ variant: 'success', message: <p>{t('SBOM imported successfully')}</p> })
            } else {
                setImportError({ variant: 'danger', message: <p>{t('SBOM import failed')}</p> })
            }
            setImportState(ImportSBOMState.IMPORTED)
        } catch (err) {
            console.error(err)
        }
    }

    const handleBrowseFile = () => {
        inputRef.current?.click()
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (e.dataTransfer.items && e.dataTransfer.items[0]) {
            if(e.dataTransfer.items[0].kind === 'file') {
                selectedFile.current = e.dataTransfer.items[0].getAsFile()
            } else {
                return
            }
        } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            selectedFile.current = e.dataTransfer.files[0]
        } else {
            return
        }
        if (importSBOMMetadata.importType === 'SPDX') {
            if (!selectedFile.current.name.endsWith('.rdf') && !selectedFile.current.name.endsWith('.xml')) {
                setFileFormatError({ variant: 'danger', message: <p>
                    {
                        selectedFile.current ? 
                        t.rich('SBOM_IMPORT_FILE_FORMAT_ERROR', {
                            fileName: selectedFile.current.name,
                            files: '.rdf, .xml'
                        }): ''
                    }
                </p>})
                return
            }
        } else {
            if (!selectedFile.current.name.endsWith('.json') && !selectedFile.current.name.endsWith('.xml')) {
                setFileFormatError({ variant: 'danger', message: <p>
                    {
                        selectedFile.current ? 
                        t.rich('SBOM_IMPORT_FILE_FORMAT_ERROR', {
                            fileName: selectedFile.current.name,
                            files: '.json, .xml'
                        }): ''
                    }
                </p>})
                return
            }
        }
        setImportState(ImportSBOMState.CONFIRM_IMPORT)
    }

    const closeModal = () => {
        setImportSBOMMetadata({ show: false, importType: 'SPDX' })
        setFileFormatError(null)
        setImportError(null)
        setImportState(ImportSBOMState.INIT_STATE)
    }

    return (
        <Modal show={importSBOMMetadata.show} onHide={() => closeModal()} backdrop='static' centered size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>
                    {
                        t.rich('Upload Project SBOM', {
                            importType: importSBOMMetadata.importType,
                            strong: (chunks) => <span className='text-primary fw-bold'>{chunks}</span>,
                        })
                    }
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {
                    fileFormatError && 
                    <Alert
                        variant={fileFormatError.variant}
                        onClose={() => setFileFormatError(null)}
                        dismissible
                    >
                        {fileFormatError.message}
                    </Alert>
                }
                {(importState === ImportSBOMState.INIT_STATE) && (
                    <>
                        <div>
                            {
                                importSBOMMetadata.importType === 'CycloneDx'?
                                <>
                                    <h5 className="fw-bold">
                                        {
                                            t.rich('UPLOAD SBOM HEADER', {
                                                fileFormats: `CycloneDx -> JSON/XML`,
                                                strong: (chunks) => <span className='text-primary'>{chunks}</span>,
                                            })
                                        }
                                    </h5>
                                    <ul>
                                        <li>{t.rich('CycloneDx import condition 1', {
                                            red: (chunks) => <span className="text-danger fw-bold">{chunks}</span>
                                        })}</li>
                                        <li>{t.rich('CycloneDx import condition 2', {
                                            red: (chunks) => <span className="text-danger fw-bold">{chunks}</span>,
                                            blue: (chunks) => <span className="text-primary">{chunks}</span>,
                                            bold: (chunks) => <span className="fw-bold">{chunks}</span>
                                        })}</li>
                                        <li>{t.rich('CycloneDx import condition 3', {
                                            red: (chunks) => <span className="text-danger fw-bold">{chunks}</span>,
                                            blue: (chunks) => <span className="text-primary">{chunks}</span>
                                        })}</li>
                                    </ul>
                                </>:
                                <>
                                    <h5 className="fw-bold">
                                        {
                                            t.rich('UPLOAD SBOM HEADER', {
                                                fileFormats: `SPDX -> RDF/XML`,
                                                strong: (chunks) => <span className='text-primary'>{chunks}</span>,
                                            })
                                        }
                                    </h5>
                                    <p>{t('current_spdx_only_supports')}.</p>
                                </>
                                
                            }
                        </div>
                        <div className={`${styles['modal-body-first']}`}>
                            <div
                                className={`${styles['modal-body-second']}`}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <span>{t('Drop a File Here')}</span>
                                <br />
                                {t('Or')}
                                <br />
                                <input
                                    className={`${styles['input']}`}
                                    ref={inputRef}
                                    type='file'
                                    onChange={handleFileChange}
                                    placeholder={t('Drop a File Here')}
                                />
                                <button type='button' className='btn btn-secondary' onClick={handleBrowseFile}>
                                    {t('Browse')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {importState === ImportSBOMState.IMPORTING && <h4 className="fw-bold">{t('Importing')}...</h4>}
                {importState === ImportSBOMState.CONFIRM_IMPORT && 
                    <p className='fw-bold'>
                        {
                            t.rich('click to import', {
                                fileName: selectedFile.current.name,
                                blue: (chunks) => <span className='text-primary'>{chunks}</span>
                            })
                        }
                    </p>
                }
                {
                    importState === ImportSBOMState.IMPORTED && (
                        importError ? 
                        <>
                            <div className="fw-bold mb-2">{t.rich('Import Error', {
                                fileName: selectedFile.current.name,
                                blue: (chunks) => <span className='text-primary'>{chunks}</span>
                            })}</div>
                            <Alert
                                variant={importError.variant}
                            >
                                {importError.message}
                            </Alert>
                        </>: ''
                    )
                }
            </Modal.Body>
            <Modal.Footer className='justify-content-end'>
                <button
                    type='button'
                    className='btn btn-dark me-2'
                    onClick={() => closeModal()}
                >
                    {t('Close')}
                </button>
                {importState === ImportSBOMState.CONFIRM_IMPORT && (
                    <button
                        type='button'
                        className='fw-bold btn btn-primary'
                        onClick={() => importFile()}
                    >
                        {t('Upload and Import')}
                    </button>
                )}
            </Modal.Footer>
        </Modal>
    )
}

export default ImportSBOMModal
