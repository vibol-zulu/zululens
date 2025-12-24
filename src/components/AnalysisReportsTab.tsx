// Analysis Reports Tab - PDF export captures modal as image
import React, { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COUNTRIES } from '@/data/mediaData';
import { useAnalysisReports, AnalysisReport } from '@/hooks/useAnalysisReports';
import { Loader2, Trash2, Pencil, Download, Eye, Check, X } from 'lucide-react';
import SearchableCountrySelect from '@/components/SearchableCountrySelect';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisReportsTabProps {
  isOpen: boolean;
}

const AnalysisReportsTab: React.FC<AnalysisReportsTabProps> = ({ isOpen }) => {
  const { reports, loading, fetchReports, updateReport, deleteReport } = useAnalysisReports();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  
  // View dialog
  const [viewReport, setViewReport] = useState<AnalysisReport | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  // Edit dialog
  const [editReport, setEditReport] = useState<AnalysisReport | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    political_lean: '',
    political_lean_justification: '',
    deduplicated_audience: 0,
    cross_platform_audience: 0,
    suggested_start_date: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Delete dialog
  const [reportToDelete, setReportToDelete] = useState<AnalysisReport | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // PDF export
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReports({ country: countryFilter, channelName: searchQuery });
    }
  }, [isOpen, countryFilter, fetchReports]);

  const handleSearch = () => {
    fetchReports({ country: countryFilter, channelName: searchQuery });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleView = (report: AnalysisReport) => {
    setViewReport(report);
    setShowViewDialog(true);
  };

  const handleEdit = (report: AnalysisReport) => {
    setEditReport(report);
    setEditFormData({
      political_lean: report.political_lean || '',
      political_lean_justification: report.political_lean_justification || '',
      deduplicated_audience: report.deduplicated_audience || 0,
      cross_platform_audience: report.cross_platform_audience || 0,
      suggested_start_date: report.suggested_start_date || ''
    });
    setShowEditDialog(true);
  };

  const saveEdit = async () => {
    if (!editReport) return;
    
    setSaving(true);
    const success = await updateReport(editReport.id, {
      political_lean: editFormData.political_lean,
      political_lean_justification: editFormData.political_lean_justification,
      deduplicated_audience: editFormData.deduplicated_audience,
      cross_platform_audience: editFormData.cross_platform_audience,
      suggested_start_date: editFormData.suggested_start_date
    });
    
    if (success) {
      setShowEditDialog(false);
      setEditReport(null);
      fetchReports({ country: countryFilter, channelName: searchQuery });
    }
    setSaving(false);
  };

  const handleDelete = (report: AnalysisReport) => {
    setReportToDelete(report);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    await deleteReport(reportToDelete.id);
    setShowDeleteDialog(false);
    setReportToDelete(null);
  };

  const exportReportAsPDF = async (report: AnalysisReport) => {
    // If we're viewing the report, capture the dialog content
    if (reportContentRef.current) {
      setIsExporting(true);
      try {
        const canvas = await html2canvas(reportContentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);
        
        // Calculate dimensions to fit on one page
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        
        // Center the image
        const x = margin + (availableWidth - scaledWidth) / 2;
        const y = margin;
        
        doc.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
        
        const fileName = `analysis-report-${report.channel_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsExporting(false);
      }
    } else {
      // Open view dialog first, then export
      setViewReport(report);
      setShowViewDialog(true);
      // Wait for dialog to render, then export
      setTimeout(async () => {
        if (reportContentRef.current) {
          setIsExporting(true);
          try {
            const canvas = await html2canvas(reportContentRef.current, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              logging: false,
            });
            
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
            
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;
            
            const x = margin + (availableWidth - scaledWidth) / 2;
            const y = margin;
            
            doc.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
            
            const fileName = `analysis-report-${report.channel_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
          } catch (error) {
            console.error('Error generating PDF:', error);
          } finally {
            setIsExporting(false);
            setShowViewDialog(false);
          }
        }
      }, 500);
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    return report.channel_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="border-b p-4 flex items-center gap-2 shrink-0 flex-wrap">
        <SearchableCountrySelect 
          value={countryFilter} 
          onValueChange={setCountryFilter}
          includeAllOption={true}
        />
        
        <Input
          placeholder="Search by channel name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-[200px]"
        />
        
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No analysis reports found
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[900px] text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Political Lean</TableHead>
                  <TableHead>Audience (M)</TableHead>
                  <TableHead>Analyzed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.channel_name}</TableCell>
                    <TableCell>{report.country}</TableCell>
                    <TableCell>
                      {report.political_lean ? (
                        <Badge variant="outline" className="capitalize">
                          {report.political_lean}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.deduplicated_audience?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.analyzer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(report.analyzed_at)}
                    </TableCell>
                    <TableCell>
                      {report.was_applied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(report)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(report)}
                          title="Edit report"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportReportAsPDF(report)}
                          title="Export PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(report)}
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {/* Capturable content - excludes buttons */}
          <div ref={reportContentRef} className="bg-background p-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Analysis Report: {viewReport?.channel_name}</DialogTitle>
            </DialogHeader>
            
            {viewReport && (
              <div className="space-y-4 mt-4">
                {/* Channel Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground text-xs">Country</Label>
                    <p className="font-medium">{viewReport.country}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Category</Label>
                    <p className="font-medium capitalize">{viewReport.submitted_category || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Platform</Label>
                    <p className="font-medium">{viewReport.submitted_platform || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Content Type</Label>
                    <p className="font-medium">{viewReport.submitted_content_type || 'N/A'}</p>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Analysis Results</h4>
                  
                  {viewReport.political_lean && (
                    <div className="p-3 border rounded-lg">
                      <Label className="text-muted-foreground text-xs">Political Lean</Label>
                      <p className="font-medium capitalize">{viewReport.political_lean}</p>
                      {viewReport.political_lean_justification && (
                        <p className="text-sm text-muted-foreground mt-1">{viewReport.political_lean_justification}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <Label className="text-muted-foreground text-xs">Cross-Platform Audience</Label>
                      <p className="text-lg font-bold">{viewReport.cross_platform_audience?.toFixed(2) || '0.00'}M</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Label className="text-muted-foreground text-xs">Deduplicated Audience</Label>
                      <p className="text-lg font-bold text-primary">{viewReport.deduplicated_audience?.toFixed(2) || '0.00'}M</p>
                    </div>
                  </div>

                  {viewReport.suggested_start_date && (
                    <div className="p-3 border rounded-lg">
                      <Label className="text-muted-foreground text-xs">Suggested Start Date</Label>
                      <p className="font-medium">{viewReport.suggested_start_date}</p>
                    </div>
                  )}
                </div>

                {/* Input Validation */}
                {viewReport.input_validation && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Input Validation</h4>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={viewReport.input_validation.categoryCorrect ? 'text-green-600' : 'text-amber-600'}>
                          {viewReport.input_validation.categoryCorrect ? '✓' : '⚠'}
                        </span>
                        <span>Category: {viewReport.input_validation.categoryCorrect ? 'Correct' : 
                          `Suggested: ${viewReport.input_validation.suggestedCategory || 'N/A'}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={viewReport.input_validation.platformCorrect ? 'text-green-600' : 'text-amber-600'}>
                          {viewReport.input_validation.platformCorrect ? '✓' : '⚠'}
                        </span>
                        <span>Platform: {viewReport.input_validation.platformCorrect ? 'Correct' : 'Review needed'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={viewReport.input_validation.contentTypeCorrect ? 'text-green-600' : 'text-amber-600'}>
                          {viewReport.input_validation.contentTypeCorrect ? '✓' : '⚠'}
                        </span>
                        <span>Content Type: {viewReport.input_validation.contentTypeCorrect ? 'Correct' : 'Review needed'}</span>
                      </div>
                      {viewReport.input_validation.validationNotes && (
                        <p className="text-muted-foreground mt-2 italic">{viewReport.input_validation.validationNotes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Comparable Channels */}
                {viewReport.comparable_channels && viewReport.comparable_channels.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Comparable Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewReport.comparable_channels.map((channel, idx) => (
                        <Badge key={idx} variant="outline">{channel}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <p>Analyzed by: {viewReport.analyzer_name} on {formatDate(viewReport.analyzed_at)}</p>
                  <p>Applied to channel: {viewReport.was_applied ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons outside capturable area */}
          <div className="flex gap-2 pt-2 px-4 pb-4">
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={() => viewReport && exportReportAsPDF(viewReport)} 
              className="flex-1"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Report: {editReport?.channel_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Political Lean</Label>
              <Select 
                value={editFormData.political_lean} 
                onValueChange={(v) => setEditFormData({ ...editFormData, political_lean: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select lean" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center-left">Center-Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="center-right">Center-Right</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Political Lean Justification</Label>
              <Textarea
                value={editFormData.political_lean_justification}
                onChange={(e) => setEditFormData({ ...editFormData, political_lean_justification: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cross-Platform Audience (M)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.cross_platform_audience}
                  onChange={(e) => setEditFormData({ ...editFormData, cross_platform_audience: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Deduplicated Audience (M)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.deduplicated_audience}
                  onChange={(e) => setEditFormData({ ...editFormData, deduplicated_audience: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Suggested Start Date</Label>
              <Input
                value={editFormData.suggested_start_date}
                onChange={(e) => setEditFormData({ ...editFormData, suggested_start_date: e.target.value })}
                placeholder="e.g., 1995, 2010"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the analysis report for "{reportToDelete?.channel_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalysisReportsTab;
