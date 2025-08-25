'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  tipo: 'elogio' | 'sugestao' | 'reclamacao' | 'melhoria';
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'pendente' | 'em_analise' | 'resolvido' | 'rejeitado';
  atendenteId: string;
  atendenteNome: string;
  autorNome: string;
  autorEmail: string;
  dataFeedback: string;
  dataResolucao?: string;
  resposta?: string;
}

const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    tipo: 'elogio',
    titulo: 'Excelente atendimento',
    descricao:
      'O atendente foi muito prestativo e resolveu minha questão rapidamente.',
    prioridade: 'baixa',
    status: 'resolvido',
    atendenteId: '1',
    atendenteNome: 'João Silva',
    autorNome: 'Maria Santos',
    autorEmail: 'maria@email.com',
    dataFeedback: '2024-01-15T10:30:00Z',
    dataResolucao: '2024-01-15T14:20:00Z',
    resposta: 'Agradecemos o feedback positivo!',
  },
  {
    id: '2',
    tipo: 'reclamacao',
    titulo: 'Demora no atendimento',
    descricao: 'Aguardei mais de 30 minutos para ser atendido.',
    prioridade: 'alta',
    status: 'em_analise',
    atendenteId: '2',
    atendenteNome: 'Ana Costa',
    autorNome: 'Pedro Oliveira',
    autorEmail: 'pedro@email.com',
    dataFeedback: '2024-01-14T16:45:00Z',
  },
];

const tipoColors = {
  elogio: 'bg-green-100 text-green-800',
  sugestao: 'bg-blue-100 text-blue-800',
  reclamacao: 'bg-red-100 text-red-800',
  melhoria: 'bg-yellow-100 text-yellow-800',
};

const prioridadeColors = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

const statusColors = {
  pendente: 'bg-gray-100 text-gray-800',
  em_analise: 'bg-blue-100 text-blue-800',
  resolvido: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pendente: Clock,
  em_analise: AlertCircle,
  resolvido: CheckCircle,
  rejeitado: AlertCircle,
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(mockFeedbacks);
  const [filteredFeedbacks, setFilteredFeedbacks] =
    useState<Feedback[]>(mockFeedbacks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [resposta, setResposta] = useState('');

  useEffect(() => {
    let filtered = feedbacks;

    if (searchTerm) {
      filtered = filtered.filter(
        feedback =>
          feedback.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.atendenteNome
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          feedback.autorNome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTipo !== 'todos') {
      filtered = filtered.filter(feedback => feedback.tipo === filterTipo);
    }

    if (filterStatus !== 'todos') {
      filtered = filtered.filter(feedback => feedback.status === filterStatus);
    }

    setFilteredFeedbacks(filtered);
  }, [feedbacks, searchTerm, filterTipo, filterStatus]);

  const handleResponder = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResposta(feedback.resposta || '');
    setIsDialogOpen(true);
  };

  const handleSalvarResposta = () => {
    if (!selectedFeedback || !resposta.trim()) {
      toast.error('Por favor, digite uma resposta');
      return;
    }

    const updatedFeedbacks = feedbacks.map(feedback =>
      feedback.id === selectedFeedback.id
        ? {
            ...feedback,
            resposta,
            status: 'resolvido' as const,
            dataResolucao: new Date().toISOString(),
          }
        : feedback
    );

    setFeedbacks(updatedFeedbacks);
    setIsDialogOpen(false);
    setSelectedFeedback(null);
    setResposta('');
    toast.success('Resposta salva com sucesso!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-muted-foreground">
            Gerencie feedbacks e avaliações dos atendimentos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por título, atendente ou autor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="elogio">Elogio</SelectItem>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="reclamacao">Reclamação</SelectItem>
                  <SelectItem value="melhoria">Melhoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Feedbacks */}
      <div className="grid gap-4">
        {filteredFeedbacks.map(feedback => {
          const StatusIcon = statusIcons[feedback.status];
          return (
            <Card
              key={feedback.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {feedback.titulo}
                      </h3>
                      <Badge className={tipoColors[feedback.tipo]}>
                        {feedback.tipo.charAt(0).toUpperCase() +
                          feedback.tipo.slice(1)}
                      </Badge>
                      <Badge className={prioridadeColors[feedback.prioridade]}>
                        {feedback.prioridade.charAt(0).toUpperCase() +
                          feedback.prioridade.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Atendente: {feedback.atendenteNome}</span>
                      <span>Autor: {feedback.autorNome}</span>
                      <span>Data: {formatDate(feedback.dataFeedback)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[feedback.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {feedback.status
                        .replace('_', ' ')
                        .charAt(0)
                        .toUpperCase() +
                        feedback.status.replace('_', ' ').slice(1)}
                    </Badge>
                    {feedback.status !== 'resolvido' && (
                      <Button
                        size="sm"
                        onClick={() => handleResponder(feedback)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Responder
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{feedback.descricao}</p>
                {feedback.resposta && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Resposta:</p>
                    <p className="text-sm">{feedback.resposta}</p>
                    {feedback.dataResolucao && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolvido em: {formatDate(feedback.dataResolucao)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFeedbacks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum feedback encontrado
            </h3>
            <p className="text-muted-foreground">
              Não há feedbacks que correspondam aos filtros selecionados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para responder feedback */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Responder Feedback</DialogTitle>
            <DialogDescription>
              {selectedFeedback && (
                <div className="space-y-2">
                  <p>
                    <strong>Título:</strong> {selectedFeedback.titulo}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {selectedFeedback.tipo}
                  </p>
                  <p>
                    <strong>Autor:</strong> {selectedFeedback.autorNome}
                  </p>
                  <p>
                    <strong>Descrição:</strong> {selectedFeedback.descricao}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resposta">Resposta</Label>
              <Textarea
                id="resposta"
                placeholder="Digite sua resposta ao feedback..."
                value={resposta}
                onChange={e => setResposta(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarResposta}>Salvar Resposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
