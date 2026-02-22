package com.dom.schoolcrm.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class AlunoTurmaId implements Serializable {

    private Long alunoId;
    private Long turmaId;

    public Long getAlunoId() { return alunoId; }
    public Long getTurmaId() { return turmaId; }
    public void setAlunoId(Long alunoId) { this.alunoId = alunoId; }
    public void setTurmaId(Long turmaId) { this.turmaId = turmaId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AlunoTurmaId)) return false;
        AlunoTurmaId that = (AlunoTurmaId) o;
        return Objects.equals(alunoId, that.alunoId) && Objects.equals(turmaId, that.turmaId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(alunoId, turmaId);
    }
}