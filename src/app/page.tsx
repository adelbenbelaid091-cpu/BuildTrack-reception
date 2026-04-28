'use client'

import { useState, useEffect } from 'react'
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
import { FileText, Building, MapPin, Calendar, Clock, Cloud, Camera, CheckCircle, XCircle, List, Eye, Trash2, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const elementTypes = [
  { id: 'semelle_isolee', label: 'Semelle isolée' },
  { id: 'semelle_filante', label: 'Semelle filante' },
  { id: 'poteau', label: 'Poteau' },
  { id: 'poutre', label: 'Poutre' },
  { id: 'muret', label: 'Muret' },
  { id: 'dalle_pleine', label: 'Dalle pleine' },
  { id: 'voile', label: 'Voile' },
  { id: 'escalier', label: 'Escalier' },
  { id: 'autre', label: 'Autre' }
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
  'MAÎTRE D\'ŒUVRE / BET',
  'MAÎTRE D\'OUVRAGE',
  'BUREAU DE CONTRÔLE (si applicable)'
]

interface ReceptionForm {
  id: string
  ficheNumber: string
  project: string
  company: string
  status: string
  createdAt: string
}

export default function ReceptionFerraillePage() {
  const [showFormsList, setShowFormsList] = useState(false)
  const [formsList, setFormsList] = useState<ReceptionForm[]>([])
  const [viewingForm, setViewingForm] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
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
    referencePlans: '',
    borderau: '',
    specifications: '',
    planNumber: '',
    planIndex: '',
    observations: '',
    followUpAction: '',
    reservationDeadline: '',
    reservationResponsible: '',
    otherInfo: ''
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

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newPhotos = [...photos]
        newPhotos[index] = reader.result as string
        setPhotos(newPhotos)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignatureChange = (index: number, field: string, value: string) => {
    const newSignatures = [...signatures]
    newSignatures[index] = { ...newSignatures[index], [field]: value }
    setSignatures(newSignatures)
  }

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/reception-forms')
      const result = await response.json()
      if (result.success) {
        setFormsList(result.data)
      } else {
        toast.error('Erreur lors de la récupération des formulaires')
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      toast.error('Erreur lors de la récupération des formulaires')
    }
  }

  useEffect(() => {
    let isMounted = true
    const loadForms = async () => {
      if (showFormsList && isMounted) {
        await fetchForms()
      }
    }
    loadForms()
    return () => {
      isMounted = false
    }
  }, [showFormsList])

  const viewForm = async (id: string) => {
    try {
      const response = await fetch(`/api/reception-forms/${id}`)
      const result = await response.json()
      if (result.success) {
        setViewingForm(result.data)
      } else {
        toast.error('Erreur lors de la récupération du formulaire')
      }
    } catch (error) {
      console.error('Error viewing form:', error)
      toast.error('Erreur lors de la récupération du formulaire')
    }
  }

  const deleteForm = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce formulaire?')) {
      return
    }

    try {
      const response = await fetch(`/api/reception-forms/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Formulaire supprimé avec succès')
        fetchForms()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const downloadPDF = async (form: any) => {
    setIsGeneratingPDF(true)
    try {
      // If we don't have full data, fetch it first
      let fullFormData = form
      if (!form.verifications) {
        const response = await fetch(`/api/reception-forms/${form.id}`)
        const result = await response.json()
        if (result.success) {
          fullFormData = result.data
        } else {
          toast.error('Erreur lors de la récupération des données')
          setIsGeneratingPDF(false)
          return
        }
      }

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: fullFormData }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Fiche_Reception_${fullFormData.ficheNumber || Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('PDF téléchargé avec succès')
      } else {
        toast.error('Erreur lors de la génération du PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleSubmit = async () => {
    // Form validation
    if (!formData.ficheNumber) {
      toast.error('Veuillez remplir le numéro de fiche')
      return
    }

    try {
      // Collect all data
      const fullFormData = {
        ...formData,
        verifications,
        photos,
        signatures
      }

      const response = await fetch('/api/reception-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullFormData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Formulaire soumis avec succès!')
        // Reset form after successful submission
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
          referencePlans: '',
          borderau: '',
          specifications: '',
          planNumber: '',
          planIndex: '',
          observations: '',
          followUpAction: '',
          reservationDeadline: '',
          reservationResponsible: '',
          otherInfo: ''
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
      } else {
        toast.error(result.error || 'Erreur lors de la soumission')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Erreur lors de la soumission du formulaire')
    }
  }

  const generateFicheNumber = () => {
    // Only generate on client-side to avoid hydration mismatch
    if (typeof window === 'undefined') return

    const date = new Date()
    const num = `FR-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    handleInputChange('ficheNumber', num)
  }

  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-lg shadow-lg shadow-orange-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Fichier de Réception Ferraillages
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Contrôle Qualité
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showFormsList} onOpenChange={setShowFormsList}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="default">
                    <List className="w-4 h-4 mr-2" />
                    Mes Formulaires
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Mes Formulaires de Réception</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {formsList.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">
                          Aucun formulaire trouvé
                        </p>
                      ) : (
                        formsList.map((form) => (
                          <Card key={form.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge>{form.ficheNumber}</Badge>
                                  <Badge variant={
                                    form.status === 'accepté' ? 'default' :
                                    form.status === 'refusé' ? 'destructive' :
                                    form.status === 'soumis' ? 'secondary' : 'outline'
                                  }>
                                    {form.status}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold">{form.project || 'Sans nom'}</h3>
                                <p className="text-sm text-slate-600">{form.company || 'Sans entreprise'}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                  Créé le: {new Date(form.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    viewForm(form.id)
                                  }}
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadPDF(form)}
                                  disabled={isGeneratingPDF}
                                  title="Télécharger PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteForm(form.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {formData.ficheNumber || 'En attente'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <ScrollArea className="h-[calc(100vh-350px)]">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* General Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Informations du Projet
                  </CardTitle>
                  <CardDescription>Détails du projet et identification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ficheNumber">N° FICHE *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateFicheNumber}
                          className="text-xs"
                        >
                          Générer
                        </Button>
                      </div>
                      <Input
                        id="ficheNumber"
                        value={formData.ficheNumber}
                        onChange={(e) => handleInputChange('ficheNumber', e.target.value)}
                        placeholder="FR-YYYYMMDD-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">PROJET</Label>
                      <Input
                        id="project"
                        value={formData.project}
                        onChange={(e) => handleInputChange('project', e.target.value)}
                        placeholder="Nom du projet"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">ENTREPRISE</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client">MAÎTRE D'ŒUVRE</Label>
                      <Input
                        id="client"
                        value={formData.client}
                        onChange={(e) => handleInputChange('client', e.target.value)}
                        placeholder="Maître d'œuvre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bureauEtude">BUREAU D'ÉTUDE</Label>
                      <Input
                        id="bureauEtude"
                        value={formData.bureauEtude}
                        onChange={(e) => handleInputChange('bureauEtude', e.target.value)}
                        placeholder="Bureau d'étude"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Localisation et Détails
                  </CardTitle>
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
                        placeholder="Bloc A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">NIVEAU / ÉTAGE</Label>
                      <Input
                        id="level"
                        value={formData.level}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        placeholder="R+1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">LOCALISATION (AXES)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="A1-B3"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="receptionDate" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        DATE DE RÉCEPTION
                      </Label>
                      <Input
                        id="receptionDate"
                        type="date"
                        value={formData.receptionDate}
                        onChange={(e) => handleInputChange('receptionDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receptionTime" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        HEURE DE RÉCEPTION
                      </Label>
                      <Input
                        id="receptionTime"
                        type="time"
                        value={formData.receptionTime}
                        onChange={(e) => handleInputChange('receptionTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weather" className="flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        CONDITIONS MÉTÉO
                      </Label>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {elementTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Checkbox
                          id={type.id}
                          checked={formData.elementType === type.id}
                          onCheckedChange={(checked) => {
                            if (checked) handleInputChange('elementType', type.id)
                          }}
                        />
                        <Label
                          htmlFor={type.id}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Autre</CardTitle>
                  <CardDescription>Informations supplémentaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="otherInfo">Autres Informations</Label>
                    <Textarea
                      id="otherInfo"
                      value={formData.otherInfo}
                      onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                      placeholder="Saisissez d'autres informations ou observations..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Vérifications de Conformité</CardTitle>
                  <CardDescription>
                    Contrôle des critères d'acceptation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {verifications.map((item, index) => (
                      <div key={index} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <Label className="font-medium text-base">{item.criteria}</Label>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`compliant-${index}`}
                                checked={item.isCompliant}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isCompliant', checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`compliant-${index}`}
                                className="flex items-center gap-1 cursor-pointer text-sm"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Conforme
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`noncompliant-${index}`}
                                checked={item.isNonCompliant}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isNonCompliant', checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`noncompliant-${index}`}
                                className="flex items-center gap-1 cursor-pointer text-sm"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                                Non Conforme
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`na-${index}`}
                                checked={item.isNotApplicable}
                                onCheckedChange={(checked) =>
                                  handleVerificationChange(index, 'isNotApplicable', checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`na-${index}`}
                                className="cursor-pointer text-sm"
                              >
                                N/A
                              </Label>
                            </div>
                          </div>
                        </div>
                        {item.isNonCompliant && (
                          <div className="space-y-2">
                            <Label htmlFor={`obs-${index}`}>Observations</Label>
                            <Textarea
                              id={`obs-${index}`}
                              value={item.observations}
                              onChange={(e) => handleVerificationObservation(index, e.target.value)}
                              placeholder="Détaillez la non-conformité..."
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Observations / Réserves</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    placeholder="Saisissez vos observations générales et réserves ici..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suites à Donner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {followUpActions.map((action) => (
                      <div key={action} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Checkbox
                          id={`action-${action}`}
                          checked={formData.followUpAction === action}
                          onCheckedChange={(checked) => {
                            if (checked) handleInputChange('followUpAction', action)
                          }}
                        />
                        <Label
                          htmlFor={`action-${action}`}
                          className="cursor-pointer text-sm"
                        >
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {(formData.followUpAction === 'Accepté sous réserve de levée des réserves' ||
                    formData.followUpAction === 'À corriger avant coulage') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="reservationDeadline">
                          DÉLAI ACCORDÉ POUR LEVÉE DES RÉSERVES
                        </Label>
                        <Input
                          id="reservationDeadline"
                          value={formData.reservationDeadline}
                          onChange={(e) => handleInputChange('reservationDeadline', e.target.value)}
                          placeholder="Date limite"
                          type="date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reservationResponsible">
                          RESPONSABLE DE LA LEVÉE DES RÉSERVES
                        </Label>
                        <Input
                          id="reservationResponsible"
                          value={formData.reservationResponsible}
                          onChange={(e) => handleInputChange('reservationResponsible', e.target.value)}
                          placeholder="Nom du responsable"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Références</CardTitle>
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
                    <Label htmlFor="borderau">BORDEREAU DE FERRAILLAGE</Label>
                    <Input
                      id="borderau"
                      value={formData.borderau}
                      onChange={(e) => handleInputChange('borderau', e.target.value)}
                      placeholder="Bordereau de ferraillage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specifications">SPÉCIFICATIONS APPLICABLES</Label>
                    <Textarea
                      id="specifications"
                      value={formData.specifications}
                      onChange={(e) => handleInputChange('specifications', e.target.value)}
                      placeholder="Spécifications applicables..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="planNumber">N° PLAN</Label>
                      <Input
                        id="planNumber"
                        value={formData.planNumber}
                        onChange={(e) => handleInputChange('planNumber', e.target.value)}
                        placeholder="Numéro de plan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planIndex">INDICE</Label>
                      <Input
                        id="planIndex"
                        value={formData.planIndex}
                        onChange={(e) => handleInputChange('planIndex', e.target.value)}
                        placeholder="Indice de révision"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos / Croquis
                  </CardTitle>
                  <CardDescription>Documentation visuelle (4 photos maximum)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="space-y-2">
                        <Label>Photo / Croquis {index + 1}</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                          {photos[index] ? (
                            <div className="space-y-2">
                              <img
                                src={photos[index]}
                                alt={`Photo ${index + 1}`}
                                className="max-h-48 mx-auto rounded"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newPhotos = [...photos]
                                  newPhotos[index] = ''
                                  setPhotos(newPhotos)
                                }}
                              >
                                Supprimer
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(index, e)}
                                className="hidden"
                                id={`photo-${index}`}
                              />
                              <Label
                                htmlFor={`photo-${index}`}
                                className="cursor-pointer block"
                              >
                                <Camera className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">
                                  Cliquez pour ajouter une photo
                                </p>
                              </Label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'signatures' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Signatures</CardTitle>
                  <CardDescription>Validation par les parties prenantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {signatures.map((sig, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg">{sig.role}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`sig-name-${index}`}>Nom</Label>
                            <Input
                              id={`sig-name-${index}`}
                              value={sig.name}
                              onChange={(e) => handleSignatureChange(index, 'name', e.target.value)}
                              placeholder="Nom complet"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-function-${index}`}>Fonction</Label>
                            <Input
                              id={`sig-function-${index}`}
                              value={sig.function}
                              onChange={(e) => handleSignatureChange(index, 'function', e.target.value)}
                              placeholder="Fonction"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-date-${index}`}>Date</Label>
                            <Input
                              id={`sig-date-${index}`}
                              type="date"
                              value={sig.date}
                              onChange={(e) => handleSignatureChange(index, 'date', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sig-time-${index}`}>Heure</Label>
                            <Input
                              id={`sig-time-${index}`}
                              type="time"
                              value={sig.time}
                              onChange={(e) => handleSignatureChange(index, 'time', e.target.value)}
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
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50">
        <div className="container mx-auto px-4">
          {/* Tabs Navigation */}
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-16 bg-transparent border-0">
              <TabsTrigger 
                value="general"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Général
              </TabsTrigger>
              <TabsTrigger 
                value="verifications"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Vérifications
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="signatures"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold transition-all duration-200"
              >
                Signatures
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
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
                  referencePlans: '',
                  borderau: '',
                  specifications: '',
                  planNumber: '',
                  planIndex: '',
                  observations: '',
                  followUpAction: '',
                  reservationDeadline: '',
                  reservationResponsible: '',
                  otherInfo: ''
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
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              size="lg"
            >
              Soumettre le Formulaire
            </Button>
          </div>
        </div>
      </div>

      {/* View Form Dialog */}
      <Dialog open={!!viewingForm} onOpenChange={(open) => !open && setViewingForm(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Détails du Formulaire</DialogTitle>
              {viewingForm && (
                <Button
                  onClick={() => downloadPDF(viewingForm)}
                  disabled={isGeneratingPDF}
                  variant="outline"
                  size="sm"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-150px)]">
            {viewingForm && (
              <div className="space-y-6">
                {/* Project Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du Projet</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>N° Fiche:</strong> {viewingForm.ficheNumber}</p>
                    <p><strong>Projet:</strong> {viewingForm.project}</p>
                    <p><strong>Entreprise:</strong> {viewingForm.company}</p>
                    <p><strong>Maître d'œuvre:</strong> {viewingForm.client}</p>
                    <p><strong>Bureau d'étude:</strong> {viewingForm.bureauEtude}</p>
                    <p><strong>Bloc:</strong> {viewingForm.block}</p>
                    <p><strong>Niveau:</strong> {viewingForm.level}</p>
                    <p><strong>Localisation:</strong> {viewingForm.location}</p>
                    <p><strong>Date:</strong> {viewingForm.receptionDate}</p>
                    <p><strong>Heure:</strong> {viewingForm.receptionTime}</p>
                    <p><strong>Météo:</strong> {viewingForm.weather}</p>
                    {viewingForm.otherInfo && <p><strong>Autre:</strong> {viewingForm.otherInfo}</p>}
                  </CardContent>
                </Card>

                {/* Verifications */}
                {viewingForm.verifications && viewingForm.verifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Vérifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {viewingForm.verifications.map((v: any, idx: number) => (
                          <div key={idx} className="border-b pb-2 last:border-0">
                            <p className="font-medium">{v.criteria}</p>
                            <div className="flex gap-4 mt-1">
                              {v.isCompliant && <span className="text-green-500">✓ Conforme</span>}
                              {v.isNonCompliant && <span className="text-red-500">✗ Non Conforme</span>}
                              {v.isNotApplicable && <span className="text-slate-500">N/A</span>}
                              {v.observations && <p className="text-sm text-slate-600 mt-1">{v.observations}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Signatures */}
                {viewingForm.signatures && viewingForm.signatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Signatures</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {viewingForm.signatures.map((s: any, idx: number) => (
                          <div key={idx} className="border-b pb-3 last:border-0">
                            <p className="font-medium">{s.role}</p>
                            <p><strong>Nom:</strong> {s.name}</p>
                            <p><strong>Fonction:</strong> {s.function}</p>
                            <p><strong>Date:</strong> {s.date}</p>
                            <p><strong>Heure:</strong> {s.time}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
