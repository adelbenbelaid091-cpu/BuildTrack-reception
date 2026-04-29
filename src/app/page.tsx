'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Building, MapPin, Calendar, Clock, Cloud, Camera, CheckCircle, XCircle, List, Eye, Trash2, Download, Loader2, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

const elementTypes = [
  { id: 'semelle_isolee', label: 'Semelle isolée' },
  { id: 'semelle_filante', label: 'Semelle filante' },
  { id: 'poteau', label: 'Poteau' },
  { id: 'poutre', label: 'Poutre' },
  { id: 'muret', label: 'Muret' },
  { id: 'dalle_pleine', label: 'Dalle pleine' },
  { id: 'voile', label: 'Voile' },
  { id: 'escalier', label: 'Escalier' },
  { id: 'autre', label: 'Autre' },
  { id: 'radier', label: 'Radier' }
]

const verificationCriteria = [
  'Conformité des barres (diamètre, nuance)',
  'Espacement des aciers',
  'Enrobage',
  'Longueur d\'ancrage et recouvrements',
  'Dispositions constructives',
  'État des surfaces (absence de rouille)',
  'Liaison entre éléments',
  'Supportage et fixation'
]

const followUpActions = [
  'Accepté sans réserve',
  'Accepté sous réserve de levée des réserves',
  'À corriger avant coulage',
  'Refusé – A reprendre'
]

const signatureRoles = [
  'ENTREPRISE',
  'MAÎTRE D\'OUVRAGE / BET',
  'MAÎTRE D\'OUVRAGE',
  'BUREAU DE CONTRÔLE (si applicable)'
]

export default function ReceptionFerraillePage() {
  const [showFormsList, setShowFormsList] = useState(false)
  const [formsList, setFormsList] = useState<any[]>([])
  const [viewingForm, setViewingForm] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfData, setPdfData] = useState<string>('')
  const [pdfFilename, setPdfFilename] = useState<string>('')
  const [formData, setFormData] = useState({
    ficheNumber: '',
    project: '',
    company: '',
    client: '',
    bureauEtude: '',
    block: '',
    level: '',
    location: '',
    receptionDate: '',
    receptionTime: '',
    weather: '',
    elementType: '',
    elementTypeOther: '',
    referencePlans: '',
    borderau: '',
    specifications: '',
    planNumber: '',
    planIndex: '',
    observations: '',
    reserves: '',
    followUpAction: '',
    reservationDeadline: '',
    reservationResponsible: ''
  })

  const [verifications, setVerifications] = useState(
    verificationCriteria.map(criteria => ({
      criteria,
      isCompliant: false,
      isNonCompliant: false,
      isNotApplicable: false,
      observations: ''
    }))
  )

  const [photos, setPhotos] = useState<string[]>([])
  const [signatures, setSignatures] = useState(
    signatureRoles.map(role => ({
      role,
      name: '',
      function: '',
      date: '',
      time: ''
    }))
  )

  const [activeTab, setActiveTab] = useState('general')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVerificationChange = (index: number, field: string, value: boolean) => {
    const newVerifications = [...verifications]
    if (field === 'isCompliant') {
      newVerifications[index].isCompliant = value
      newVerifications[index].isNonCompliant = false
      newVerifications[index].isNotApplicable = false
    } else if (field === 'isNonCompliant') {
      newVerifications[index].isNonCompliant = value
      newVerifications[index].isCompliant = false
      newVerifications[index].isNotApplicable = false
    } else if (field === 'isNotApplicable') {
      newVerifications[index].isNotApplicable = value
      newVerifications[index].isCompliant = false
      newVerifications[index].isNonCompliant = false
    }
    setVerifications(newVerifications)
  }

  const handleVerificationObservation = (index: number, value: string) => {
    const newVerifications = [...verifications]
    newVerifications[index].observations = value
    setVerifications(newVerifications)
  }

  const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          // Store the server path of the uploaded photo
          const newPhotos = [...photos]
          newPhotos[index] = `/api/files/${result.data.filename}`
          setPhotos(newPhotos)
          toast.success('Photo ajoutée avec succès!')
        } else {
          toast.error(result.error || 'Erreur lors du téléchargement')
        }
      } catch (error) {
        console.error('Error uploading photo:', error)
        toast.error('Erreur lors du téléchargement de la photo')
      }
    }
  }

  const handleSignatureChange = (index: number, field: string, value: string) => {
    const newSignatures = [...signatures]
    newSignatures[index] = { ...newSignatures[index], [field]: value }
    setSignatures(newSignatures)
  }

  const handleSubmit = async () => {
    if (!formData.ficheNumber) {
      toast.error('Veuillez remplir le numéro de fiche')
      return
    }

    try {
      setIsGeneratingPDF(true)
      const fullFormData = {
        ...formData,
        verifications,
        photos,
        signatures
      }

      // Generate PDF and show in modal (for WebView mobile apps)
      try {
        toast.loading('Génération du PDF en cours...', { id: 'pdf-loading' })

        // Use base64 API for mobile compatibility
        const pdfResponse = await fetch('/api/generate-pdf-base64', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: fullFormData }),
        })

        if (pdfResponse.ok) {
          const result = await pdfResponse.json()

          if (result.success && result.data) {
            // Store PDF data and show in modal
            setPdfData(result.data)
            setPdfFilename(result.filename || `Fiche_Reception_${formData.ficheNumber}.pdf`)
            setShowPDFModal(true)

            toast.success('PDF généré!', { id: 'pdf-loading' })
          } else {
            toast.error('Erreur lors de la génération du PDF', { id: 'pdf-loading' })
          }
        } else {
          const errorText = await pdfResponse.text()
          console.error('PDF generation error:', errorText)
          toast.error('Erreur lors de la génération du PDF', { id: 'pdf-loading' })
        }
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError)
        toast.error('Erreur lors de la génération du PDF', { id: 'pdf-loading' })
      }

      // Reset form
      setFormData({
        ficheNumber: '',
        project: '',
        company: '',
        client: '',
        bureauEtude: '',
        block: '',
        level: '',
        location: '',
        receptionDate: '',
        receptionTime: '',
        weather: '',
        elementType: '',
        elementTypeOther: '',
        referencePlans: '',
        borderau: '',
        specifications: '',
        planNumber: '',
        planIndex: '',
        observations: '',
        reserves: '',
        followUpAction: '',
        reservationDeadline: '',
        reservationResponsible: ''
      })
      setVerifications(verificationCriteria.map(criteria => ({
        criteria,
        isCompliant: false,
        isNonCompliant: false,
        isNotApplicable: false,
        observations: ''
      })))
      setPhotos([])
      setSignatures(signatureRoles.map(role => ({
        role,
        name: '',
        function: '',
        date: '',
        time: ''
      })))
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Erreur lors de la soumission du formulaire')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const generateFicheNumber = () => {
    if (typeof window === 'undefined') return

    const date = new Date()
    const num = `FR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    handleInputChange('ficheNumber', num)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col pb-[180px] md:pb-0">
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 md:p-2.5 rounded-lg shadow-lg shadow-orange-500/20">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-lg md:text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Fichier de Réception Ferraillages
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Contrôle Qualité
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <Badge variant="outline" className="text-sm md:text-lg px-2 md:px-4 py-1 md:py-2">
                {formData.ficheNumber || 'En attente'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8">
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-250px)]">
          {activeTab === 'general' && (
            <div className="space-y-4 md:space-y-6">
              {/* General Information */}
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Building className="w-4 h-4 md:w-5 md:h-5" />
                    Informations du Projet
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Détails du projet et identification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ficheNumber" className="text-sm md:text-base">N° FICHE *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateFicheNumber}
                          className="text-xs h-8 px-2"
                        >
                          Générer
                        </Button>
                      </div>
                      <Input
                        id="ficheNumber"
                        value={formData.ficheNumber}
                        onChange={(e) => handleInputChange('ficheNumber', e.target.value)}
                        placeholder="FR-YYYYMMDD-XXXX"
                        className="h-10 md:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project" className="text-sm md:text-base">PROJET</Label>
                      <Input
                        id="project"
                        value={formData.project}
                        onChange={(e) => handleInputChange('project', e.target.value)}
                        placeholder="Nom du projet"
                        className="h-10 md:h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm md:text-base">ENTREPRISE</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Nom de l'entreprise"
                        className="h-10 md:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client" className="text-sm md:text-base">MAÎTRE D'OUVRAGE</Label>
                      <Input
                        id="client"
                        value={formData.client}
                        onChange={(e) => handleInputChange('client', e.target.value)}
                        placeholder="Maître d'œuvre"
                        className="h-10 md:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bureauEtude" className="text-sm md:text-base">BUREAU D'ÉTUDE</Label>
                      <Input
                        id="bureauEtude"
                        value={formData.bureauEtude}
                        onChange={(e) => handleInputChange('bureauEtude', e.target.value)}
                        placeholder="Bureau d'étude"
                        className="h-10 md:h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Localisation et Détails</CardTitle>
                  <CardDescription>Emplacement et informations de réception</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="block">BLOC / ZONE</Label>
                      <Input
                        id="block"
                        value={formData.block}
                        onChange={(e) => handleInputChange('block', e.target.value)}
                        placeholder="Bloc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">NIVEAU / ÉTAGE</Label>
                      <Input
                        id="level"
                        value={formData.level}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        placeholder="Niveau"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">LOCALISATION (AXES)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Axes"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="receptionDate">DATE DE RÉCEPTION</Label>
                      <Input
                        id="receptionDate"
                        type="date"
                        value={formData.receptionDate}
                        onChange={(e) => handleInputChange('receptionDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receptionTime">HEURE DE RÉCEPTION</Label>
                      <Input
                        id="receptionTime"
                        type="time"
                        value={formData.receptionTime}
                        onChange={(e) => handleInputChange('receptionTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weather">CONDITIONS MÉTÉO</Label>
                      <Input
                        id="weather"
                        value={formData.weather}
                        onChange={(e) => handleInputChange('weather', e.target.value)}
                        placeholder="Ensoleillé, Pluvieux, etc."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Type d'Élément</CardTitle>
                  <CardDescription>Sélectionnez le type d'élément inspecté</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="elementType">TYPE D'ÉLÉMENT</Label>
                    <select
                      id="elementType"
                      value={formData.elementType}
                      onChange={(e) => handleInputChange('elementType', e.target.value)}
                      className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Sélectionner...</option>
                      {elementTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {formData.elementType === 'autre' && (
                      <div className="space-y-2 mt-2">
                        <Label htmlFor="elementTypeOther">AUTRE (PRÉCISER)</Label>
                        <Input
                          id="elementTypeOther"
                          value={formData.elementTypeOther}
                          onChange={(e) => handleInputChange('elementTypeOther', e.target.value)}
                          placeholder="Ex: autre radier, autre dalle, autre manuel..."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="text-base md:text-lg">Vérifications de Conformité</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Contrôle des critères d'acceptation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:space-y-6">
                    {verifications.map((item, index) => (
                      <div key={index} className="space-y-3 p-3 md:p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <Label className="font-medium text-sm md:text-base flex-1">{item.criteria}</Label>
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="flex items-center space-x-1 md:space-x-2">
                              <Checkbox
                                id={`compliant-${index}`}
                                checked={item.isCompliant}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isCompliant', checked as boolean)
                                }
                                className="w-5 h-5"
                              />
                              <Label
                                htmlFor={`compliant-${index}`}
                                className="flex items-center gap-1 cursor-pointer text-xs md:text-sm"
                              >
                                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                                <span className="hidden sm:inline">Conforme</span>
                                <span className="sm:hidden">Conf.</span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1 md:space-x-2">
                              <Checkbox
                                id={`noncompliant-${index}`}
                                checked={item.isNonCompliant}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isNonCompliant', checked as boolean)
                                }
                                className="w-5 h-5"
                              />
                              <Label
                                htmlFor={`noncompliant-${index}`}
                                className="flex items-center gap-1 cursor-pointer text-xs md:text-sm"
                              >
                                <XCircle className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                                <span className="hidden sm:inline">Non Conf.</span>
                                <span className="sm:hidden">N.C.</span>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1 md:space-x-2">
                              <Checkbox
                                id={`notapplicable-${index}`}
                                checked={item.isNotApplicable}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isNotApplicable', checked as boolean)
                                }
                                className="w-5 h-5"
                              />
                              <Label
                                htmlFor={`notapplicable-${index}`}
                                className="flex items-center gap-1 cursor-pointer text-xs md:text-sm"
                              >
                                N/A
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Observations / Réserves</CardTitle>
                  <CardDescription>Observations générales et réserves</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="observations">OBSERVATIONS</Label>
                      <Textarea
                        id="observations"
                        value={formData.observations}
                        onChange={(e) => handleInputChange('observations', e.target.value)}
                        placeholder="Saisissez vos observations générales ici..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reserves">RÉSERVES</Label>
                      <Textarea
                        id="reserves"
                        value={formData.reserves}
                        onChange={(e) => handleInputChange('reserves', e.target.value)}
                        placeholder="Saisissez vos réserves ici..."
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suites à Donner</CardTitle>
                  <CardDescription>Classification de la réception</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accepte-sans"
                          checked={formData.followUpAction === 'Accepté sans réserve'}
                          onCheckedChange={(checked) =>
                            handleInputChange('followUpAction', checked ? 'Accepté sans réserve' : '')
                          }
                        />
                        <Label
                          htmlFor="accepte-sans"
                          className="flex items-center gap-1 cursor-pointer text-sm"
                        >
                          Accepté sans réserve
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accepte-reserve"
                          checked={formData.followUpAction === 'Accepté sous réserve de levée des réserves'}
                          onCheckedChange={(checked) =>
                            handleInputChange('followUpAction', checked ? 'Accepté sous réserve de levée des réserves' : '')
                          }
                        />
                        <Label
                          htmlFor="accepte-reserve"
                          className="flex items-center gap-1 cursor-pointer text-sm"
                        >
                          Accepté sous réserve de levée des réserves
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="corriger-avant"
                          checked={formData.followUpAction === 'À corriger avant coulage'}
                          onCheckedChange={(checked) =>
                            handleInputChange('followUpAction', checked ? 'À corriger avant coulage' : '')
                          }
                        />
                        <Label
                          htmlFor="corriger-avant"
                          className="flex items-center gap-1 cursor-pointer text-sm"
                        >
                          À corriger avant coulage
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="refuse-reprendre"
                          checked={formData.followUpAction === 'Refusé – A reprendre'}
                          onCheckedChange={(checked) =>
                            handleInputChange('followUpAction', checked ? 'Refusé – A reprendre' : '')
                          }
                        />
                        <Label
                          htmlFor="refuse-reprendre"
                          className="flex items-center gap-1 cursor-pointer text-sm"
                        >
                          Refusé – A reprendre
                        </Label>
                      </div>
                    </div>
                    {(formData.followUpAction === 'Accepté sous réserve de levée des réserves' || formData.followUpAction === 'À corriger avant coulage') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="reservationDeadline">DÉLAI ACCORDÉ POUR LEVÉE DES RÉSERVES</Label>
                          <Input
                            id="reservationDeadline"
                            type="date"
                            value={formData.reservationDeadline}
                            onChange={(e) => handleInputChange('reservationDeadline', e.target.value)}
                            placeholder="jj/mm/aaaa"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reservationResponsible">RESPONSABLE DE LA LEVÉE DES RÉSERVES</Label>
                          <Input
                            id="reservationResponsible"
                            value={formData.reservationResponsible}
                            onChange={(e) => handleInputChange('reservationResponsible', e.target.value)}
                            placeholder="Nom du responsable"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Références
                  </CardTitle>
                  <CardDescription>Documents de référence et spécifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="referencePlans">PLANS DE RÉFÉRENCE</Label>
                    <Input
                      id="referencePlans"
                      value={formData.referencePlans}
                      onChange={(e) => handleInputChange('referencePlans', e.target.value)}
                      placeholder="Plans de référence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specifications">SPÉCIFICATIONS</Label>
                    <Textarea
                      id="specifications"
                      value={formData.specifications}
                      onChange={(e) => handleInputChange('specifications', e.target.value)}
                      placeholder="Spécifications techniques..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos / Croquis
                  </CardTitle>
                  <CardDescription>Ajoutez des photos et des croquis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm">Photo {index + 1}</Label>
                          <div className="relative aspect-video border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
                            {photos[index] ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={photos[index]}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
                                  onClick={() => {
                                    const newPhotos = [...photos]
                                    newPhotos[index] = ''
                                    setPhotos(newPhotos)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Label
                                  htmlFor={`photo-${index}`}
                                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full space-y-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Camera className="w-8 h-8 text-slate-400" />
                                  <span className="text-sm text-slate-500">Ajouter</span>
                                </Label>
                                <Input
                                  id={`photo-${index}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(index, e)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'signatures' && (
            <div className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="pb-4 md:pb-6">
                  <CardTitle className="text-base md:text-lg">Signatures</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Validation par les parties prenantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 md:space-y-6">
                    {signatures.map((sig, index) => (
                      <div key={index} className="p-3 md:p-4 border rounded-lg space-y-3 md:space-y-4">
                        <h3 className="font-semibold text-sm md:text-lg">{sig.role}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`sig-name-${index}`} className="text-sm md:text-base">Nom</Label>
                            <Input
                              id={`sig-name-${index}`}
                              value={sig.name}
                              onChange={(e) => handleSignatureChange(index, 'name', e.target.value)}
                              placeholder="Nom complet"
                              className="h-10 md:h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-function-${index}`} className="text-sm md:text-base">Fonction</Label>
                            <Input
                              id={`sig-function-${index}`}
                              value={sig.function}
                              onChange={(e) => handleSignatureChange(index, 'function', e.target.value)}
                              placeholder="Fonction"
                              className="h-10 md:h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-date-${index}`} className="text-sm md:text-base">Date</Label>
                            <Input
                              id={`sig-date-${index}`}
                              type="date"
                              value={sig.date}
                              onChange={(e) => handleSignatureChange(index, 'date', e.target.value)}
                              className="h-10 md:h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-time-${index}`} className="text-sm md:text-base">Heure</Label>
                            <Input
                              id={`sig-time-${index}`}
                              type="time"
                              value={sig.time}
                              onChange={(e) => handleSignatureChange(index, 'time', e.target.value)}
                              className="h-10 md:h-10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Fixed Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-lg z-50">
        <div className="container mx-auto px-2 md:px-4">
          {/* Tabs Navigation */}
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-14 md:h-16 bg-transparent border-0">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200 text-xs md:text-sm font-medium"
              >
                <div className="flex flex-col items-center gap-1">
                  <FileText className="w-4 h-4 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Général</span>
                  <span className="sm:hidden">Général</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="verifications"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200 text-xs md:text-sm font-medium"
              >
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-4 h-4 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Vérifications</span>
                  <span className="sm:hidden">Vérif.</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200 text-xs md:text-sm font-medium"
              >
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-4 h-4 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Documents</span>
                  <span className="sm:hidden">Docs</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="signatures"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200 text-xs md:text-sm font-medium"
              >
                <div className="flex flex-col items-center gap-1">
                  <FileText className="w-4 h-4 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Signatures</span>
                  <span className="sm:hidden">Sign.</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-4 border-t border-slate-200 dark:border-slate-800 pt-3 md:pt-4 mt-3 md:mt-4">
            <Button
              onClick={() => {
                setFormData({
                  ficheNumber: '',
                  project: '',
                  company: '',
                  client: '',
                  bureauEtude: '',
                  block: '',
                  level: '',
                  location: '',
                  receptionDate: '',
                  receptionTime: '',
                  weather: '',
                  elementType: '',
                  elementTypeOther: '',
                  referencePlans: '',
                  borderau: '',
                  specifications: '',
                  planNumber: '',
                  planIndex: '',
                  observations: '',
                  reserves: '',
                  followUpAction: '',
                  reservationDeadline: '',
                  reservationResponsible: ''
                })
                setVerifications(verificationCriteria.map(criteria => ({
                  criteria,
                  isCompliant: false,
                  isNonCompliant: false,
                  isNotApplicable: false,
                  observations: ''
                })))
                setPhotos([])
                setSignatures(signatureRoles.map(role => ({
                  role,
                  name: '',
                  function: '',
                  date: '',
                  time: ''
                })))
              }}
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none h-10 md:h-10 text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Réinitialiser</span>
              <span className="sm:hidden">Réinit.</span>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isGeneratingPDF}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold flex-[2] md:flex-none h-10 md:h-10"
              size="sm"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Génération...</span>
                  <span className="sm:hidden">Gén...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Soumettre</span>
                  <span className="sm:hidden">Soumettre</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Modal - Shows PDF with multiple download options */}
      <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Votre PDF est prêt!</DialogTitle>
              <Button
                onClick={() => setShowPDFModal(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                <strong>⚠️ Note:</strong> Le téléchargement automatique est limité dans cette application. Veuillez utiliser les options ci-dessous.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Choisissez une option:</p>

              <div className="space-y-2">
                {/* Option 1: Try direct download */}
                <Button
                  onClick={() => {
                    if (pdfData) {
                      try {
                        // Method 1: Blob download
                        const byteCharacters = atob(pdfData.split(',')[1])
                        const byteNumbers = new Array(byteCharacters.length)
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i)
                        }
                        const byteArray = new Uint8Array(byteNumbers)
                        const blob = new Blob([byteArray], { type: 'application/pdf' })

                        // Try to download
                        const link = document.createElement('a')
                        link.href = window.URL.createObjectURL(blob)
                        link.download = pdfFilename
                        document.body.appendChild(link)
                        link.click()
                        setTimeout(() => {
                          window.URL.revokeObjectURL(link.href)
                          document.body.removeChild(link)
                        }, 100)

                        toast.success('Téléchargement lancé! Vérifiez vos téléchargements.')
                      } catch (error) {
                        toast.error('Téléchargement échoué. Essayez l\'option 2.')
                      }
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded">
                      <Download className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Option 1: Téléchargement direct</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Essayez d'abord cette option</div>
                    </div>
                  </div>
                </Button>

                {/* Option 2: Open in new tab/window */}
                <Button
                  onClick={() => {
                    if (pdfData) {
                      const newWindow = window.open(pdfData, '_blank', 'noopener,noreferrer')
                      if (newWindow) {
                        toast.success('PDF ouvert dans un nouvel onglet!')
                      } else {
                        toast.error('Impossible d\'ouvrir. Essayez l\'option 3.')
                      }
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Option 2: Ouvrir dans le navigateur</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Ouvre PDF dans une nouvelle fenêtre</div>
                    </div>
                  </div>
                </Button>

                {/* Option 3: Copy to clipboard (last resort) */}
                <Button
                  onClick={() => {
                    if (pdfData) {
                      try {
                        navigator.clipboard.writeText(pdfData)
                        toast.success('Copié! Collez dans une nouvelle fenêtre du navigateur.')
                      } catch (error) {
                        toast.error('Copie échouée')
                      }
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Option 3: Copier le PDF</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Copiez et collez dans un nouveau navigateur</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                💡 Astuce: Si aucune option ne fonctionne, essayez d'ouvrir l'application dans un navigateur externe (Chrome/Safari) pour un meilleur téléchargement.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Form Dialog */}
      <Dialog open={!!viewingForm} onOpenChange={(open) => !open && setViewingForm(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détails du Formulaire</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-150px)]">
            {viewingForm && (
              <div className="space-y-6 p-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations du Projet</h3>
                  <p><strong>Projet:</strong> {viewingForm.project}</p>
                  <p><strong>Entreprise:</strong> {viewingForm.company}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
