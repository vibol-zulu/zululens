import React, { useEffect, useState } from 'react';
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
import jsPDF from 'jspdf';

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

  const exportReportAsPDF = (report: AnalysisReport) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const lineHeight = 7;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const tableColWidth = contentWidth / 2;

    const addWrappedText = (text: string, x: number, y: number, maxWidth: number): number => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to draw a table row
    const drawTableRow = (label: string, value: string, y: number, isHeader: boolean = false): number => {
      if (isHeader) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 4, contentWidth, lineHeight + 2, 'F');
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, y - 4, tableColWidth, lineHeight + 2);
      doc.rect(margin + tableColWidth, y - 4, tableColWidth, lineHeight + 2);
      doc.text(label, margin + 2, y);
      doc.text(value, margin + tableColWidth + 2, y);
      return y + lineHeight + 2;
    };

    // Extract run details from raw_analysis if available
    const rawAnalysis = report.raw_analysis as {
      reasoning?: string;
      runDetails?: Array<{ crossPlatformAudience: number; deduplicatedAudience: number }>;
      crossPlatformRange?: { min: number; max: number };
      deduplicatedRange?: { min: number; max: number };
    } | null;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text('Channel Analysis Report', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += lineHeight;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('3-Run Cross-Check Analysis Methodology', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += lineHeight * 2;

    // Channel Information Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Channel Information', margin, yPos);
    yPos += lineHeight + 2;
    
    doc.setFontSize(9);
    yPos = drawTableRow('Field', 'Value', yPos, true);
    yPos = drawTableRow('Channel Name', report.channel_name, yPos);
    yPos = drawTableRow('Country', report.country, yPos);
    yPos = drawTableRow('Category', report.submitted_category || 'N/A', yPos);
    yPos = drawTableRow('Platform', report.submitted_platform || 'N/A', yPos);
    yPos = drawTableRow('Content Type', report.submitted_content_type || 'N/A', yPos);
    yPos = drawTableRow('Analysis Date', formatDate(report.analyzed_at), yPos);
    yPos = drawTableRow('Analyzed By', report.analyzer_name || 'Unknown', yPos);
    yPos = drawTableRow('Applied to Channel', report.was_applied ? 'Yes' : 'No', yPos);
    yPos += lineHeight;

    // Input Validation Table
    if (report.input_validation) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Input Validation', margin, yPos);
      yPos += lineHeight + 2;
      
      doc.setFontSize(9);
      yPos = drawTableRow('Field', 'Status', yPos, true);
      const catStatus = report.input_validation.categoryCorrect ? '✓ Correct' : 
        `⚠ Suggested: ${report.input_validation.suggestedCategory || 'N/A'}`;
      yPos = drawTableRow('Category', catStatus, yPos);
      yPos = drawTableRow('Platform', report.input_validation.platformCorrect ? '✓ Correct' : '⚠ Review needed', yPos);
      yPos = drawTableRow('Content Type', report.input_validation.contentTypeCorrect ? '✓ Correct' : '⚠ Review needed', yPos);
      
      if (report.input_validation.validationNotes) {
        yPos += 2;
        doc.setFont('helvetica', 'italic');
        yPos = addWrappedText(`Notes: ${report.input_validation.validationNotes}`, margin, yPos, contentWidth);
      }
      yPos += lineHeight;
    }

    // Political Lean Section
    if (report.political_lean) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Political Lean Analysis', margin, yPos);
      yPos += lineHeight + 2;
      
      doc.setFontSize(9);
      yPos = drawTableRow('Field', 'Value', yPos, true);
      yPos = drawTableRow('Political Lean', report.political_lean.toUpperCase(), yPos);
      
      if (report.political_lean_justification) {
        yPos += 2;
        doc.setFont('helvetica', 'bold');
        doc.text('Justification:', margin, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
        yPos = addWrappedText(report.political_lean_justification, margin, yPos, contentWidth);
      }
      yPos += lineHeight;
    }

    // Audience Estimation Results Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Audience Estimation Results (3-Run Mean)', margin, yPos);
    yPos += lineHeight + 2;
    
    doc.setFontSize(9);
    yPos = drawTableRow('Metric', 'Value', yPos, true);
    yPos = drawTableRow('Cross-Platform Audience (Mean)', `${report.cross_platform_audience?.toFixed(2) || '0.00'}M`, yPos);
    if (rawAnalysis?.crossPlatformRange) {
      yPos = drawTableRow('Cross-Platform Range', `${rawAnalysis.crossPlatformRange.min.toFixed(2)}M – ${rawAnalysis.crossPlatformRange.max.toFixed(2)}M`, yPos);
    }
    yPos = drawTableRow('Deduplicated Audience (Mean)', `${report.deduplicated_audience?.toFixed(2) || '0.00'}M`, yPos);
    if (rawAnalysis?.deduplicatedRange) {
      yPos = drawTableRow('Deduplicated Range', `${rawAnalysis.deduplicatedRange.min.toFixed(2)}M – ${rawAnalysis.deduplicatedRange.max.toFixed(2)}M`, yPos);
    }
    if (report.suggested_start_date) {
      yPos = drawTableRow('Suggested Start Date', report.suggested_start_date, yPos);
    }
    yPos += lineHeight;

    // Individual Run Results Table
    if (rawAnalysis?.runDetails && rawAnalysis.runDetails.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Individual Run Results', margin, yPos);
      yPos += lineHeight + 2;
      
      doc.setFontSize(9);
      // Custom 3-column table for runs
      const col1Width = contentWidth / 3;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 4, contentWidth, lineHeight + 2, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos - 4, col1Width, lineHeight + 2);
      doc.rect(margin + col1Width, yPos - 4, col1Width, lineHeight + 2);
      doc.rect(margin + col1Width * 2, yPos - 4, col1Width, lineHeight + 2);
      doc.setFont('helvetica', 'bold');
      doc.text('Run', margin + 2, yPos);
      doc.text('Cross-Platform', margin + col1Width + 2, yPos);
      doc.text('Deduplicated', margin + col1Width * 2 + 2, yPos);
      yPos += lineHeight + 2;
      
      doc.setFont('helvetica', 'normal');
      rawAnalysis.runDetails.forEach((run, idx) => {
        doc.rect(margin, yPos - 4, col1Width, lineHeight + 2);
        doc.rect(margin + col1Width, yPos - 4, col1Width, lineHeight + 2);
        doc.rect(margin + col1Width * 2, yPos - 4, col1Width, lineHeight + 2);
        doc.text(`Run ${idx + 1}`, margin + 2, yPos);
        doc.text(`${run.crossPlatformAudience.toFixed(2)}M`, margin + col1Width + 2, yPos);
        doc.text(`${run.deduplicatedAudience.toFixed(2)}M`, margin + col1Width * 2 + 2, yPos);
        yPos += lineHeight + 2;
      });
      yPos += lineHeight;
    }

    // Reasoning Section
    if (rawAnalysis?.reasoning) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Analysis Reasoning', margin, yPos);
      yPos += lineHeight + 2;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(rawAnalysis.reasoning, margin, yPos, contentWidth);
      yPos += lineHeight;
    }

    // Comparable Channels Section
    if (report.comparable_channels && report.comparable_channels.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Comparable Channels', margin, yPos);
      yPos += lineHeight + 2;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const channelsList = report.comparable_channels.map((c, i) => `${i + 1}. ${c}`).join('\n');
      yPos = addWrappedText(channelsList, margin, yPos, contentWidth);
    }

    // Footer on all pages
    const pageCount = doc.internal.pages.length - 1;
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated by Media Landscape Analysis Tool • ${new Date().toLocaleString()} • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    const fileName = `analysis-report-${report.channel_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    return report.channel_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="border-b p-4 flex items-center gap-2 shrink-0 flex-wrap">
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {COUNTRIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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
          <DialogHeader>
            <DialogTitle>Analysis Report: {viewReport?.channel_name}</DialogTitle>
          </DialogHeader>
          
          {viewReport && (
            <div className="space-y-4">
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

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowViewDialog(false)} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => exportReportAsPDF(viewReport)} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          )}
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
