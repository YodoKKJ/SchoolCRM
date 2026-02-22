package com.dom.schoolcrm.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ProfessorTurmaMateriaId implements Serializable {

    private Long professorId;
    private Long turmaId;
    private Long materiaId;

    public Long getProfessorId() { return professorId; }
    public Long getTurmaId() { return turmaId; }
    public Long getMateriaId() { return materiaId; }
    public void setProfessorId(Long professorId) { this.professorId = professorId; }
    public void setTurmaId(Long turmaId) { this.turmaId = turmaId; }
    public void setMateriaId(Long materiaId) { this.materiaId = materiaId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProfessorTurmaMateriaId)) return false;
        ProfessorTurmaMateriaId that = (ProfessorTurmaMateriaId) o;
        return Objects.equals(professorId, that.professorId) &&
                Objects.equals(turmaId, that.turmaId) &&
                Objects.equals(materiaId, that.materiaId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(professorId, turmaId, materiaId);
    }
}