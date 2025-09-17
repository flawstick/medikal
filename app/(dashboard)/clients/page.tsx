"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Merge,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowButton } from "@/components/ui/flow-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export default function ClientsPage() {
  const [allClients, setAllClients] = useState<Client[]>([]); // Store all fetched clients
  const [clients, setClients] = useState<Client[]>([]); // Current page clients
  const [clientMissions, setClientMissions] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeData, setMergeData] = useState({
    keepClientId: "",
    mergeClientId: ""
  });
  const [merging, setMerging] = useState(false);
  const [keepClientOpen, setKeepClientOpen] = useState(false);
  const [mergeClientOpen, setMergeClientOpen] = useState(false);
  const [allClientsForMerge, setAllClientsForMerge] = useState<Client[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    batchPage: 1, // Track which batch (100 clients) we're on
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const { toast } = useToast();

  const CLIENTS_PER_PAGE = 10;
  const BATCH_SIZE = 100;

  useEffect(() => {
    fetchAllMissions();
    fetchClientsBatch(1, "", true);
  }, []);

  const fetchAllMissions = async () => {
    try {
      const response = await fetch('/api/missions?limit=1000');
      if (response.ok) {
        const missionsData = await response.json();
        const missions = missionsData.data || missionsData;

        // Count missions per client
        const missionCounts: Record<number, number> = {};
        missions.forEach((mission: any) => {
          if (mission.client_id) {
            missionCounts[mission.client_id] = (missionCounts[mission.client_id] || 0) + 1;
          }
        });
        setClientMissions(missionCounts);

      }
    } catch (error) {
      console.error("Error fetching missions:", error);
    }
  };

  const fetchClientsBatch = async (batchPage = 1, query = "", isInitialLoad = false) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        status: 'active',
        page: batchPage.toString(),
        limit: BATCH_SIZE.toString()
      });

      if (query) {
        params.append('query', query);
      }

      const clientsResponse = await fetch(`/api/clients?${params}`);

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        const fetchedClients = clientsData.data || clientsData;

        setAllClients(fetchedClients);
        setPagination(prev => ({
          ...clientsData.pagination,
          page: isInitialLoad ? 1 : prev.page, // Reset to page 1 only on initial load
          batchPage,
          totalPages: Math.ceil((clientsData.pagination?.total || 0) / CLIENTS_PER_PAGE)
        }));

        // Calculate which local page within the batch to show
        const pagesPerBatch = BATCH_SIZE / CLIENTS_PER_PAGE;
        const pageToShow = isInitialLoad ? 1 : currentPage;
        const currentPageInBatch = ((pageToShow - 1) % pagesPerBatch) + 1;
        updateCurrentPageClients(fetchedClients, currentPageInBatch);

        if (isInitialLoad) {
          setCurrentPage(1);
        }
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת רשימת הלקוחות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientsBatch(1, searchQuery, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    // Calculate which batch this page belongs to (10 pages per batch since 100 clients / 10 per page = 10 pages)
    const pagesPerBatch = BATCH_SIZE / CLIENTS_PER_PAGE; // 10 pages per batch
    const targetBatchPage = Math.ceil(newPage / pagesPerBatch);

    if (targetBatchPage !== pagination.batchPage) {
      // Need to fetch new batch - the fetchClientsBatch will handle setting the correct page
      fetchClientsBatch(targetBatchPage, searchQuery);
      // Update the current page state immediately
      setCurrentPage(newPage);
      setPagination(prev => ({ ...prev, page: newPage }));
    } else {
      // Use existing data, just update page
      const localPageInBatch = ((newPage - 1) % pagesPerBatch) + 1;
      setCurrentPage(newPage);
      updateCurrentPageClients(allClients, localPageInBatch);
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const handleMergeClients = async () => {
    if (!mergeData.keepClientId || !mergeData.mergeClientId) {
      toast({
        title: "שגיאה",
        description: "יש לבחור שני לקוחות למיזוג",
        variant: "destructive",
      });
      return;
    }

    setMerging(true);

    try {
      const response = await fetch('/api/clients/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keepClientId: parseInt(mergeData.keepClientId),
          mergeClientId: parseInt(mergeData.mergeClientId)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: result.message,
          variant: "default",
        });

        // Refresh clients list
        fetchClientsBatch(pagination.batchPage, searchQuery);

        // Close dialog and reset
        setMergeDialogOpen(false);
        setMergeData({ keepClientId: "", mergeClientId: "" });
      } else {
        throw new Error(result.error || "Failed to merge clients");
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "שגיאה במיזוג לקוחות",
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
  };

  const updateCurrentPageClients = (allClientsData: Client[], page: number) => {
    const startIndex = (page - 1) * CLIENTS_PER_PAGE;
    const endIndex = startIndex + CLIENTS_PER_PAGE;
    const pageClients = allClientsData.slice(startIndex, endIndex);
    setClients(pageClients);
  };

  // Fetch all clients for merge dialog
  const fetchAllClientsForMerge = async () => {
    try {
      const response = await fetch('/api/clients?status=active&limit=1000');
      if (response.ok) {
        const clientsData = await response.json();
        setAllClientsForMerge(clientsData.data || clientsData);
      }
    } catch (error) {
      console.error("Error fetching all clients for merge:", error);
    }
  };

  // Load all clients when merge dialog opens
  useEffect(() => {
    if (mergeDialogOpen) {
      fetchAllClientsForMerge();
    }
  }, [mergeDialogOpen]);

  if (loading) {
    return (
      <div className="space-y-6 pt-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>


        {/* Search Skeleton */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <Skeleton className="h-10 w-64" />
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-48" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 space-x-reverse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול לקוחות</h1>
          <p className="text-muted-foreground">
            נהל את כל הלקוחות ועקוב אחר הפעילות שלהם
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-card">
                <Merge className="h-4 w-4 ml-2" />
                מיזוג לקוחות
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>מיזוג לקוחות</DialogTitle>
                <DialogDescription>
                  בחר שני לקוחות למיזוג. כל המשלוחים יועברו ללקוח הראשון והלקוח השני יימחק.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">לקוח ראשי (יישמר):</label>
                  <Popover open={keepClientOpen} onOpenChange={setKeepClientOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={keepClientOpen}
                        className="w-full justify-between bg-card"
                      >
                        {mergeData.keepClientId
                          ? allClientsForMerge.find((client) => client.id.toString() === mergeData.keepClientId)?.name
                          : "בחר לקוח ראשי..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" dir="rtl">
                      <Command>
                        <CommandInput placeholder="חפש לקוח..." className="border-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none [&>input]:border-none [&>input]:focus:ring-0 [&>input]:focus:outline-none [&>input]:focus:border-none [&>input]:pr-2" />
                        <CommandList>
                          <CommandEmpty>לא נמצא לקוח.</CommandEmpty>
                          <CommandGroup>
                            {allClientsForMerge.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => {
                                  setMergeData(prev => ({ ...prev, keepClientId: client.id.toString() }));
                                  setKeepClientOpen(false);
                                }}
                              >
                                <Check
                                  className={`ml-2 h-4 w-4 ${
                                    mergeData.keepClientId === client.id.toString() ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {client.name} ({clientMissions[client.id] || 0} משלוחים)
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">לקוח למיזוג (יימחק):</label>
                  <Popover open={mergeClientOpen} onOpenChange={setMergeClientOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={mergeClientOpen}
                        className="w-full justify-between bg-card"
                      >
                        {mergeData.mergeClientId
                          ? allClientsForMerge.find((client) => client.id.toString() === mergeData.mergeClientId)?.name
                          : "בחר לקוח למיזוג..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" dir="rtl">
                      <Command>
                        <CommandInput placeholder="חפש לקוח..." className="border-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none [&>input]:border-none [&>input]:focus:ring-0 [&>input]:focus:outline-none [&>input]:focus:border-none [&>input]:pr-2" />
                        <CommandList>
                          <CommandEmpty>לא נמצא לקוח.</CommandEmpty>
                          <CommandGroup>
                            {allClientsForMerge
                              .filter(client => client.id.toString() !== mergeData.keepClientId)
                              .map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => {
                                  setMergeData(prev => ({ ...prev, mergeClientId: client.id.toString() }));
                                  setMergeClientOpen(false);
                                }}
                              >
                                <Check
                                  className={`ml-2 h-4 w-4 ${
                                    mergeData.mergeClientId === client.id.toString() ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {client.name} ({clientMissions[client.id] || 0} משלוחים)
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setMergeDialogOpen(false)}
                    disabled={merging}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleMergeClients}
                    disabled={merging || !mergeData.keepClientId || !mergeData.mergeClientId}
                  >
                    {merging ? "מבצע מיזוג..." : "מזג לקוחות"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Link href="/clients/new">
            <FlowButton text="לקוח חדש" />
          </Link>
        </div>
      </motion.div>


      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center space-x-2 space-x-reverse"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חפש לקוחות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right bg-card border border-input"
          />
        </div>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>רשימת לקוחות</CardTitle>
            <CardDescription>
              {clients.length} לקוחות מתוך {pagination.total} (עמוד {pagination.page} מתוך {pagination.totalPages})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">אין לקוחות</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "לא נמצאו לקוחות התואמים לחיפוש" : "עדיין לא הוספת לקוחות למערכת"}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link href="/clients/new">
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף לקוח ראשון
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם לקוח</TableHead>
                      <TableHead className="text-right">פרטי קשר</TableHead>
                      <TableHead className="text-right">מיקום</TableHead>
                      <TableHead className="text-right">תאריך הוספה</TableHead>
                      <TableHead className="text-right">משלוחים</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client, index) => (
                    <TableRow
                      key={client.id}
                      className="group hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            {client.address && (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 ml-1" />
                                {client.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 ml-1 text-muted-foreground" />
                              {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 ml-1 text-muted-foreground" />
                              {client.email}
                            </div>
                          )}
                          {!client.phone && !client.email && (
                            <span className="text-muted-foreground text-sm">אין פרטי קשר</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.address ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 ml-1 text-muted-foreground" />
                            {client.address}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">לא צוין</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 ml-1 text-muted-foreground" />
                          {formatDate(client.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Package className="h-3 w-3 ml-1 text-muted-foreground" />
                          <span className="font-medium">{clientMissions[client.id] || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      עמוד {pagination.page} מתוך {pagination.totalPages}
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                        הקודם
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        הבא
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}